'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaSpinner, 
  FaThumbsUp, 
  FaChevronRight, 
  FaSearch,
  FaFilter,
  FaTerminal,
  FaSortAmountDown,
  FaSortAmountUp,
  FaCheckCircle
} from 'react-icons/fa';
import Link from 'next/link';
import { getFingerprint, storeVotedFeatures, getStoredVotedFeatures } from '@/lib/client/fingerprint';

interface FeatureRequest {
  _id: string;
  featureId: string;
  title: string;
  description: string;
  votes: number;
  status: 'pending' | 'under_review' | 'planned' | 'in_progress' | 'completed' | 'rejected';
  submittedBy: string;
  submittedAt: string;
  lastUpdatedAt: string;
  tags: string[];
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function FeatureRequests() {
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [votedFeatures, setVotedFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState<string>('');
  const [loadingVotes, setLoadingVotes] = useState(true);

  useEffect(() => {
    // Initialize fingerprint and load voted features
    const initFingerprint = async () => {
      try {
        // Get browser fingerprint
        const fp = await getFingerprint();
        setFingerprint(fp);
        
        // Fetch server-side vote data
        await fetchVotedFeatures(fp);
      } catch (error) {
        console.error('Error initializing fingerprint:', error);
      } finally {
        setLoadingVotes(false);
      }
    };
    
    initFingerprint();
  }, []);

  useEffect(() => {
    // Fetch feature requests once fingerprint is loaded
    if (!loadingVotes) {
      fetchFeatureRequests();
    }
  }, [pagination.page, statusFilter, sortOrder, loadingVotes]);

  const fetchVotedFeatures = async (fp: string) => {
    try {
      // First check if we have local encrypted vote data
      const storedVotes = getStoredVotedFeatures();

      // Then verify with server-side vote data
      const clientData = btoa(fp); // Base64 encode the fingerprint for transport
      const response = await fetch(`/api/features/vote?clientData=${encodeURIComponent(clientData)}`);
      
      if (response.ok) {
        const data = await response.json();
        setVotedFeatures(data.votedFeatureIds);
        
        // Update local storage with latest encrypted vote data
        if (data.encryptedVotes) {
          storeVotedFeatures(data.encryptedVotes);
        }
      } else {
        // If server-side verification fails, use local data as fallback
        console.warn('Server-side vote verification failed, using local data only');
      }
    } catch (error) {
      console.error('Error fetching voted features:', error);
    }
  };

  const fetchFeatureRequests = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', pagination.page.toString());
      queryParams.set('limit', pagination.limit.toString());
      if (statusFilter) {
        queryParams.set('status', statusFilter);
      }

      const response = await fetch(`/api/features?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch feature requests');
      }

      const data = await response.json();
      setFeatureRequests(data.featureRequests);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching feature requests:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const upvoteFeature = async (featureId: string) => {
    // Check if user has already voted for this feature
    if (votedFeatures.includes(featureId)) {
      return;
    }

    try {
      // Get updated fingerprint in case it changed
      const fp = await getFingerprint();
      
      const response = await fetch('/api/features/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          featureId,
          clientData: btoa(fp) // Base64 encode the fingerprint for transport
        }),
      });

      // Handle response even if it's not OK
      let errorData = null;
      try {
        errorData = await response.json();
      } catch (e) {
        console.error('Error parsing response:', e);
        throw new Error('Failed to process vote response');
      }

      if (!response.ok) {
        if (errorData?.alreadyVoted) {
          // If server says they already voted, update local state
          setVotedFeatures(prev => [...prev, featureId]);
          setError('You have already voted for this feature');
        } else {
          throw new Error(errorData?.error || 'Failed to upvote feature');
        }
        return;
      }
      
      // Update voted features from server data
      if (errorData.votedFeatureIds) {
        setVotedFeatures(errorData.votedFeatureIds);
      }
      
      // Store encrypted vote data
      if (errorData.encryptedVotes) {
        storeVotedFeatures(errorData.encryptedVotes);
      }
      
      // Refresh the list
      fetchFeatureRequests();
      
      // Clear any previous errors
      setError(null);
    } catch (error) {
      console.error('Error upvoting feature:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  const handleFeatureRequestChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewFeature(e.target.value);
  };

  const submitFeatureRequest = async () => {
    if (!newFeature.trim()) {
      setSubmitError('Please enter a feature request');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const response = await fetch('/api/features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'User Feature Request',
          description: newFeature,
          tags: ['user-submitted']
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit feature request');
      }

      setNewFeature('');
      setSubmitSuccess(true);
      // Refresh the list after submission
      fetchFeatureRequests();
    } catch (error) {
      console.error('Error submitting feature request:', error);
      setSubmitError(error instanceof Error ? error.message : 'An unknown error occurred');
      setSubmitSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'under_review':
        return 'bg-blue-500/20 text-blue-400';
      case 'planned':
        return 'bg-purple-500/20 text-purple-400';
      case 'in_progress':
        return 'bg-orange-500/20 text-orange-400';
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'rejected':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const filteredRequests = featureRequests.filter(feature => {
    if (!searchQuery) return true;
    
    return (
      feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortOrder === 'desc') {
      return b.votes - a.votes;
    } else {
      return a.votes - b.votes;
    }
  });

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <div className="container mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full mb-12 max-w-5xl mx-auto"
        >
          <div className="bg-gray-900 border border-green-500/30 rounded-t-md p-2 flex items-center">
            <div className="flex items-center space-x-2 mr-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="text-xs text-gray-400">domain-intel-features.sh</div>
          </div>
          
          <div className="bg-gray-900/70 rounded-b-md border-x border-b border-green-500/30 p-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-green-400">$</span> <span className="typing-animation">domain-intel --feature-requests</span>
                  <div className="mt-3 pl-4 text-sm space-y-1">
                    <p className="text-gray-400">Domain Intelligence Tool - Feature Requests</p>
                    <p className="text-gray-400">Vote on features or submit your own ideas</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Submit a new feature request */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-8 bg-black/60 p-4 rounded border border-green-500/30"
            >
              <div className="flex items-center text-xs text-gray-400 mb-2">
                <FaTerminal className="mr-2 text-green-500" />
                <span>Submit New Feature Request</span>
              </div>
              <div className="text-xs text-gray-400">
                <p className="mb-2">Describe your feature idea in detail:</p>
                <textarea 
                  placeholder="I would like to see..."
                  className="w-full bg-black/50 border border-green-500/30 rounded px-3 py-2 text-green-400 focus:outline-none focus:border-green-500 h-24"
                  value={newFeature}
                  onChange={handleFeatureRequestChange}
                  disabled={submitting}
                />
                <div className="flex justify-end mt-2">
                  <button 
                    className={`bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 text-green-400 px-4 py-2 rounded flex items-center ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={submitFeatureRequest}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="inline mr-2 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <FaChevronRight className="inline mr-2" /> Submit
                      </>
                    )}
                  </button>
                </div>
                
                {submitSuccess === true && (
                  <div className="mt-2 text-green-400 bg-green-400/10 px-2 py-1 rounded">
                    <FaCheckCircle className="inline mr-1" /> Thank you! Your feature request has been submitted.
                  </div>
                )}
                
                {submitError && (
                  <div className="mt-2 text-red-400 bg-red-400/10 px-2 py-1 rounded">
                    Error: {submitError}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Search and filter */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center"
            >
              <div className="flex flex-1">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Search feature requests..."
                    className="w-full bg-black/50 border border-green-500/30 rounded pl-10 pr-3 py-2 text-green-400 focus:outline-none focus:border-green-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <div>
                  <select 
                    className="bg-gray-900 border border-green-500/30 rounded p-2"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                <button 
                  className="bg-gray-900 border border-green-500/30 rounded p-2 flex items-center"
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  title={sortOrder === 'desc' ? 'Sort by fewest votes' : 'Sort by most votes'}
                >
                  {sortOrder === 'desc' ? (
                    <FaSortAmountDown className="text-green-400" />
                  ) : (
                    <FaSortAmountUp className="text-green-400" />
                  )}
                </button>
              </div>
            </motion.div>

            {error && (
              <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4">
                Error: {error}
              </div>
            )}

            {/* Feature requests list */}
            {loading || loadingVotes ? (
              <div className="flex justify-center items-center h-40">
                <FaSpinner className="animate-spin text-2xl mr-2" />
                <p>Loading feature requests...</p>
              </div>
            ) : sortedRequests.length === 0 ? (
              <div className="bg-gray-900/50 border border-green-500/20 rounded p-6 text-center">
                <p>No feature requests found. Be the first to submit one!</p>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-4"
              >
                {sortedRequests.map((feature, index) => (
                  <motion.div 
                    key={feature.featureId} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + (index * 0.05) }}
                    className="bg-gray-900/50 border border-green-500/30 rounded-md p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-lg font-semibold">{feature.title}</h2>
                      <div className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(feature.status)}`}>
                        {getStatusLabel(feature.status)}
                      </div>
                    </div>
                    
                    <p className="text-gray-400 mb-4">{feature.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                      {feature.tags.map((tag, index) => (
                        <span key={index} className="bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <div>
                        <p>Submitted: {new Date(feature.submittedAt).toLocaleDateString()}</p>
                        <p>Last updated: {new Date(feature.lastUpdatedAt).toLocaleDateString()}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">{feature.votes}</span>
                        <button 
                          onClick={() => upvoteFeature(feature.featureId)}
                          className={`p-2 rounded flex items-center ${
                            votedFeatures.includes(feature.featureId)
                              ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                              : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                          }`}
                          title={votedFeatures.includes(feature.featureId) ? 'Already voted' : 'Upvote this feature'}
                          disabled={votedFeatures.includes(feature.featureId)}
                        >
                          <FaThumbsUp />
                          <span className="ml-2">
                            {votedFeatures.includes(feature.featureId) ? 'Voted' : 'Vote'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
                    disabled={pagination.page === 1}
                    className={`px-3 py-1 rounded ${
                      pagination.page === 1 
                        ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed' 
                        : 'bg-gray-700 text-green-400 hover:bg-gray-600'
                    }`}
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: pagination.pages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPagination({ ...pagination, page: i + 1 })}
                      className={`px-3 py-1 rounded ${
                        pagination.page === i + 1 
                          ? 'bg-green-600/30 text-green-400' 
                          : 'bg-gray-700 text-green-400 hover:bg-gray-600'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setPagination({ ...pagination, page: Math.min(pagination.pages, pagination.page + 1) })}
                    disabled={pagination.page === pagination.pages}
                    className={`px-3 py-1 rounded ${
                      pagination.page === pagination.pages 
                        ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed' 
                        : 'bg-gray-700 text-green-400 hover:bg-gray-600'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 