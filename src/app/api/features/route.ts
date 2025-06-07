import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import FeatureRequestModel from '@/lib/models/FeatureRequestModel';

// POST: Create a new feature request
export async function POST(req: NextRequest) {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    
    // Parse the request body
    const body = await req.json();
    
    // Validate the input
    if (!body.title || !body.description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }
    
    // Create a new feature request
    const featureRequest = new FeatureRequestModel({
      featureId: uuidv4(),
      title: body.title,
      description: body.description,
      submittedBy: body.submittedBy || 'Anonymous',
      tags: body.tags || ['user-submitted'],
    });
    
    // Save to database
    await featureRequest.save();
    
    return NextResponse.json(
      { 
        message: 'Feature request submitted successfully',
        featureRequest 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting feature request:', error);
    return NextResponse.json(
      { error: 'Failed to submit feature request' },
      { status: 500 }
    );
  }
}

// GET: Retrieve feature requests
export async function GET(req: NextRequest) {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    
    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    
    // Build query
    const query: any = {};
    if (status) {
      query.status = status;
    }
    
    // Fetch data with pagination
    const skip = (page - 1) * limit;
    const featureRequests = await FeatureRequestModel.find(query)
      .sort({ votes: -1, submittedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await FeatureRequestModel.countDocuments(query);
    
    return NextResponse.json({
      featureRequests,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching feature requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature requests' },
      { status: 500 }
    );
  }
}

// PATCH: Update a feature request (upvote only - admin functionality removed)
export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // Validate required fields
    if (!body.featureId) {
      return NextResponse.json(
        { error: 'Feature ID is required' },
        { status: 400 }
      );
    }

    // If this is an upvote action, redirect to the dedicated vote endpoint
    if (body.action === 'upvote') {
      // Create a redirect response
      return NextResponse.redirect(new URL('/api/features/vote', req.url), 307);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating feature request:', error);
    return NextResponse.json(
      { error: 'Failed to update feature request' },
      { status: 500 }
    );
  }
} 