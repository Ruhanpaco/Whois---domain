import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import FeatureRequestModel from '@/lib/models/FeatureRequestModel';
import VoteModel from '@/lib/models/VoteModel';
import { hashIpAddress, generateFingerprint, encryptVoteData } from '@/lib/fingerprint';

export async function POST(req: NextRequest) {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    
    // Parse the request body
    const body = await req.json();
    
    // Validate the input
    if (!body.featureId) {
      return NextResponse.json(
        { error: 'Feature ID is required' },
        { status: 400 }
      );
    }

    // Get client IP address
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';
    const ipHash = hashIpAddress(ip);
    
    // Get user agent for fingerprinting
    const userAgent = req.headers.get('user-agent') || '';
    
    // Generate a fingerprint
    // In a real application, you'd also use other browser attributes
    // such as screen resolution, timezone, etc.
    const additionalData = body.clientData || ''; // Client can send additional fingerprinting data
    const fingerprint = generateFingerprint(userAgent, additionalData);
    
    // Check if the user already voted for this feature
    const existingVote = await VoteModel.findOne({
      featureId: body.featureId,
      ipHash: ipHash,
      fingerprint: fingerprint
    });
    
    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted for this feature', alreadyVoted: true },
        { status: 409 }
      );
    }
    
    // Create a new vote entry
    const vote = new VoteModel({
      featureId: body.featureId,
      ipHash: ipHash,
      fingerprint: fingerprint
    });
    
    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Save the vote
      await vote.save({ session });
      
      // Increment the vote count in the feature request
      const feature = await FeatureRequestModel.findOneAndUpdate(
        { featureId: body.featureId },
        { $inc: { votes: 1 } },
        { new: true, session }
      );
      
      if (!feature) {
        // If feature not found, abort transaction
        await session.abortTransaction();
        session.endSession();
        
        return NextResponse.json(
          { error: 'Feature request not found' },
          { status: 404 }
        );
      }
      
      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
      
      // Get all voted feature IDs for this user
      const userVotes = await VoteModel.find({
        ipHash: ipHash,
        fingerprint: fingerprint
      }).select('featureId -_id');
      
      const votedFeatureIds = userVotes.map(vote => vote.featureId);
      
      // Encrypt the vote data for client-side storage
      const encryptedVotes = encryptVoteData(votedFeatureIds);
      
      return NextResponse.json({
        message: 'Vote recorded successfully',
        feature,
        votedFeatureIds,
        encryptedVotes
      });
    } catch (error) {
      // If any error occurs, abort the transaction
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error: any) {
    console.error('Error recording vote:', error);
    
    // Check for duplicate key error (user already voted)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'You have already voted for this feature', alreadyVoted: true },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    
    // Get client IP and fingerprint
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';
    const ipHash = hashIpAddress(ip);
    
    const userAgent = req.headers.get('user-agent') || '';
    const url = new URL(req.url);
    const additionalData = url.searchParams.get('clientData') || '';
    const fingerprint = generateFingerprint(userAgent, additionalData);
    
    // Get all voted feature IDs for this user
    const userVotes = await VoteModel.find({
      ipHash: ipHash,
      fingerprint: fingerprint
    }).select('featureId -_id');
    
    const votedFeatureIds = userVotes.map(vote => vote.featureId);
    
    // Encrypt the vote data for client-side storage
    const encryptedVotes = encryptVoteData(votedFeatureIds);
    
    return NextResponse.json({
      votedFeatureIds,
      encryptedVotes
    });
  } catch (error) {
    console.error('Error fetching votes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch votes' },
      { status: 500 }
    );
  }
} 