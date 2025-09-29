"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

<<<<<<< HEAD
=======
/**
 * Manipal Hackathon '25 Bug Bounty Tracker - Clean Modern UI
 */

>>>>>>> origin/main
const LS_KEYS = {
  VALID: "gh_valid_issues_v1",
  INVALID: "gh_invalid_issues_v1",
  ISSUELESS: "gh_issueless_repos_v1",
};

// Enhanced image extraction utility for multiple images
const extractAllImagesFromContent = (content) => {
  if (!content || typeof content !== 'string') return [];
  
  const images = [];
  
  // Find all markdown images: ![alt](url)
  const markdownMatches = content.matchAll(/!\[.*?\]\((https?:\/\/[^\s\)]+)\)/g);
  for (const match of markdownMatches) {
    images.push(match[1]);
  }
  
  // Find all HTML img tags
  const htmlMatches = content.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/g);
  for (const match of htmlMatches) {
    images.push(match[1]);
  }
  
  // Find all direct image URLs
  const directMatches = content.matchAll(/(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg))/gi);
  for (const match of directMatches) {
    images.push(match[1]);
  }
  
  return [...new Set(images)];
};

// Get first image for preview
const getPreviewImage = (issue) => {
  const allImages = extractAllImagesFromContent(issue.body) || 
                   extractAllImagesFromContent(issue.description) || 
                   extractAllImagesFromContent(issue.content);
  return allImages.length > 0 ? allImages[0] : null;
};

// Get GitHub issue URL
const getGitHubIssueUrl = (issue) => {
  if (issue.html_url) return issue.html_url;
  if (issue.repo && issue.number) {
    return `https://github.com/${issue.repo}/issues/${issue.number}`;
  }
  if (issue.repo && issue.id) {
    return `https://github.com/${issue.repo}/issues/${issue.id}`;
  }
  return null;
};

// Network Image Widget Component
const NetworkImageWidget = ({ issue, size = "md" }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32"
  };

  useEffect(() => {
    const previewImage = getPreviewImage(issue);
    setImageUrl(previewImage);
    setIsLoading(!previewImage);
  }, [issue]);

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  return (
    <div className={`${sizeClasses[size]} bg-slate-800 border border-slate-600 rounded-lg flex-shrink-0 overflow-hidden`}>
      {imageUrl && !imageError ? (
        <div className="relative w-full h-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <Image
            src={imageUrl}
            alt={`Preview for ${issue.title || 'issue'}`}
            fill
            className={`object-cover rounded-lg transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onError={handleImageError}
            onLoad={handleImageLoad}
            unoptimized
            sizes={size === 'lg' ? '128px' : size === 'md' ? '80px' : '48px'}
          />
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs text-center leading-tight">No Image</span>
        </div>
      )}
    </div>
  );
};

// Image Gallery Modal Component
const ImageGalleryModal = ({ images, isOpen, onClose, currentIndex = 0 }) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);

  useEffect(() => {
    setActiveIndex(currentIndex);
  }, [currentIndex]);

  if (!isOpen || !images.length) return null;

  const nextImage = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center" onClick={onClose}>
      <div className="relative max-w-4xl max-h-screen p-4" onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 w-10 h-10 bg-white rounded-full text-black hover:bg-gray-200 flex items-center justify-center text-xl font-bold shadow-lg"
        >
          ×
        </button>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full text-black hover:bg-gray-200 flex items-center justify-center text-2xl font-bold shadow-lg"
            >
              ‹
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full text-black hover:bg-gray-200 flex items-center justify-center text-2xl font-bold shadow-lg"
            >
              ›
            </button>
          </>
        )}

        {/* Main Image */}
        <Image
          src={images[activeIndex]}
          alt={`Image ${activeIndex + 1} of ${images.length}`}
          width={800}
          height={600}
          className="max-w-full max-h-screen object-contain rounded-lg"
          unoptimized
        />

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-black px-4 py-2 rounded-full text-sm font-medium">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
};

// Issue Detail Modal Component
const IssueDetailModal = ({ issue, isOpen, onClose, onMarkValid, onMarkInvalid }) => {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  if (!isOpen || !issue) return null;

  const allImages = extractAllImagesFromContent(issue.body) || 
                   extractAllImagesFromContent(issue.description) || 
                   extractAllImagesFromContent(issue.content) || [];
  
  const githubUrl = getGitHubIssueUrl(issue);

  const openGallery = (index = 0) => {
    setSelectedImageIndex(index);
    setGalleryOpen(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black bg-opacity-75" onClick={onClose}></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white">Issue Details</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            
            {/* Issue Title */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">
                {issue.title || "(No title)"}
              </h3>
            </div>

            {/* Images */}
            {allImages.length > 0 && (
              <div>
                <h4 className="text-lg font-medium text-white mb-3">
                  Images ({allImages.length})
                </h4>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {allImages.map((img, index) => (
                    <div
                      key={index}
                      className="relative aspect-square bg-slate-700 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openGallery(index)}
                    >
                      <Image
                        src={img}
                        alt={`Image ${index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-700 p-4 rounded-lg">
                <h5 className="font-medium text-white mb-2">Repository</h5>
                <p className="text-slate-300">{issue.repo || issue.name || "Unknown"}</p>
              </div>
              
              <div className="bg-slate-700 p-4 rounded-lg">
                <h5 className="font-medium text-white mb-2">Reporter Team</h5>
                <p className="text-slate-300">{issue.reporterTeam || "Unknown team"}</p>
              </div>

              {issue.reporter && (
                <div className="bg-slate-700 p-4 rounded-lg">
                  <h5 className="font-medium text-white mb-2">Reporter</h5>
                  <p className="text-slate-300">@{issue.reporter}</p>
                </div>
              )}
              
              {issue.createdAt && (
                <div className="bg-slate-700 p-4 rounded-lg">
                  <h5 className="font-medium text-white mb-2">Created</h5>
                  <p className="text-slate-300">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {(issue.body || issue.description || issue.content) && (
              <div>
                <h4 className="text-lg font-medium text-white mb-3">Description</h4>
                <div className="bg-slate-700 p-4 rounded-lg text-slate-300 max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">
                    {issue.body || issue.description || issue.content}
                  </pre>
                </div>
              </div>
            )}

            {/* GitHub Link */}
            {githubUrl && (
              <div>
                <h4 className="text-lg font-medium text-white mb-3">GitHub Link</h4>
                <a 
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline break-all"
                >
                  {githubUrl}
                </a>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
            <button
              onClick={() => {
                onMarkValid(issue);
                onClose();
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Mark Valid
            </button>
            <button
              onClick={() => {
                onMarkInvalid(issue);
                onClose();
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Mark Invalid
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <ImageGalleryModal
        images={allImages}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        currentIndex={selectedImageIndex}
      />
    </>
  );
};

export default function Page() {
  const [issues, setIssues] = useState([]);
  const [issuelessRepos, setIssuelessRepos] = useState([]);
  const [validIssues, setValidIssues] = useState([]);
  const [invalidIssues, setInvalidIssues] = useState([]);
  const [expandedIssueId, setExpandedIssueId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const POLL_INTERVAL = 15000;

<<<<<<< HEAD
=======
  // Helper functions
>>>>>>> origin/main
  const idsFrom = (arr) => (arr && arr.length ? arr.map((i) => i.id) : []);

  const uniqueById = (arr) => {
    const seen = new Set();
    const out = [];
    for (const it of arr) {
      if (!it || typeof it.id === "undefined") continue;
      if (!seen.has(it.id)) {
        seen.add(it.id);
        out.push(it);
      }
    }
    return out;
  };

<<<<<<< HEAD
=======
  // Load persisted state and fetch
>>>>>>> origin/main
  useEffect(() => {
    try {
      const pValid = JSON.parse(localStorage.getItem(LS_KEYS.VALID) || "[]");
      const pInvalid = JSON.parse(localStorage.getItem(LS_KEYS.INVALID) || "[]");
      const pIssueless = JSON.parse(localStorage.getItem(LS_KEYS.ISSUELESS) || "[]");

      if (Array.isArray(pValid) && pValid.length) setValidIssues(pValid);
      if (Array.isArray(pInvalid) && pInvalid.length) setInvalidIssues(pInvalid);
      if (Array.isArray(pIssueless) && pIssueless.length) setIssuelessRepos(pIssueless);

      fetchIssues(pValid || [], pInvalid || []);
    } catch (err) {
      console.warn("Failed to load persisted lists:", err);
      fetchIssues();
    }
  }, []);

<<<<<<< HEAD
=======
  // Persist data
>>>>>>> origin/main
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEYS.VALID, JSON.stringify(validIssues));
      localStorage.setItem(LS_KEYS.INVALID, JSON.stringify(invalidIssues));
      localStorage.setItem(LS_KEYS.ISSUELESS, JSON.stringify(issuelessRepos));
    } catch (err) {
      console.warn("Failed to persist lists:", err);
    }
  }, [validIssues, invalidIssues, issuelessRepos]);

<<<<<<< HEAD
=======
  // Polling
>>>>>>> origin/main
  useEffect(() => {
    const interval = setInterval(() => fetchIssues(), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [validIssues, invalidIssues]);

  async function fetchIssues(validOverride = null, invalidOverride = null) {
    setError("");
    try {
      const validArr = Array.isArray(validOverride) ? validOverride : validIssues;
      const invalidArr = Array.isArray(invalidOverride) ? invalidOverride : invalidIssues;

      const validIds = idsFrom(validArr).join(",");
      const invalidIds = idsFrom(invalidArr).join(",");

      const q = new URLSearchParams();
      if (validIds) q.set("validIds", validIds);
      if (invalidIds) q.set("invalidIds", invalidIds);

      const res = await fetch(`/api/issues${q.toString() ? `?${q.toString()}` : ""}`);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Server returned ${res.status} ${text}`);
      }

      const data = await res.json();
      if (!data || !("issues" in data) || !("issuelessRepos" in data)) {
        setError("Invalid data received from server");
        setLoading(false);
        return;
      }

      const reposWithIssuesSet = new Set((data.issues || []).map((i) => i.repo).filter(Boolean));

      setIssuelessRepos((prev) => {
        const prevMap = new Map(prev.map((r) => [r.name, r]));
        for (const name of reposWithIssuesSet) {
          if (prevMap.has(name)) prevMap.delete(name);
        }
        for (const r of data.issuelessRepos || []) {
          if (!prevMap.has(r.name) && !reposWithIssuesSet.has(r.name)) {
            prevMap.set(r.name, r);
          }
        }
        return Array.from(prevMap.values());
      });

      setIssues((prev) => {
        const existingIdSet = new Set([
          ...prev.map((i) => i.id),
          ...validIssues.map((i) => i.id),
          ...invalidIssues.map((i) => i.id),
        ]);
        const newIssues = (data.issues || []).filter((i) => !existingIdSet.has(i.id));
        if (!newIssues.length) return prev;
        const merged = [...prev, ...newIssues];
        return uniqueById(merged);
      });
    } catch (err) {
      console.error("fetchIssues error:", err);
      setError(typeof err === "string" ? err : err.message || "Failed to fetch issues");
    } finally {
      setLoading(false);
    }
  }

  const markValid = (issue) => {
    setValidIssues((prev) => uniqueById([...prev, issue]));
    setIssues((prev) => prev.filter((i) => i.id !== issue.id));
  };

  const markInvalid = (issue) => {
    setInvalidIssues((prev) => uniqueById([...prev, issue]));
    setIssues((prev) => prev.filter((i) => i.id !== issue.id));
  };

<<<<<<< HEAD
  const toggleExpand = (id) => {
    setExpandedIssueId((prev) => (prev === id ? null : id));
=======
  const openIssueModal = (issue) => {
    setSelectedIssue(issue);
    setIsModalOpen(true);
  };

  const closeIssueModal = () => {
    setSelectedIssue(null);
    setIsModalOpen(false);
>>>>>>> origin/main
  };

  const exportCSV = (data, filename) => {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]);
    const rows = [headers.join(",")];
    for (const row of data) {
      const vals = headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`);
      rows.push(vals.join(","));
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

<<<<<<< HEAD
  const parseBody = (body) => {
    if (!body) return null;
    const elements = [];
    let lastIndex = 0;
    // match ![alt](url)
    const regex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
    let match;
    while ((match = regex.exec(body)) !== null) {
      const index = match.index;
      if (index > lastIndex) {
        elements.push(body.substring(lastIndex, index));
      }
      elements.push(
        <img
          key={index}
          src={match[1]}
          alt=""
          className="max-w-full rounded-md shadow-sm my-2"
        />
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < body.length) {
      elements.push(body.substring(lastIndex));
    }
    return elements;
  };

  const renderTable = (data, includeActions = false) => (
    <table className="min-w-full border-collapse mb-8">
      <thead>
        <tr className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-200">
          <th className="px-4 py-2 border">Title / Repo</th>
          <th className="px-4 py-2 border">Reporter (Team/User)</th>
          {includeActions && <th className="px-4 py-2 border">Actions</th>}
          <th className="px-4 py-2 border">Created At</th>
        </tr>
      </thead>
      <tbody>
        {(!data || data.length === 0) ? (
          <tr>
            <td colSpan={includeActions ? 4 : 3} className="px-4 py-3 text-center text-gray-500">
              No issues / repos
            </td>
          </tr>
        ) : (
          data.map((issue) => (
            <tr
              key={issue.id ?? issue.name}
              className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition transform hover:-translate-y-1 hover:shadow-lg duration-200 rounded-lg"
            >
              <td className="px-4 py-3 border">
                <div className="font-medium">
                  {issue.title || "(No issues)"}{" "}
                  {issue.repo ? ` / ${issue.repo}` : issue.name ? ` / ${issue.name}` : ""}
                </div>
                {issue.body && (
                  <div className="mt-2">
                    {expandedIssueId === issue.id ? (
                      <div className="max-w-full">
                        {parseBody(issue.body)}
                        <button
                          onClick={() => toggleExpand(issue.id)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-sm mt-2"
                        >
                          Show less
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => toggleExpand(issue.id)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-sm mt-1"
                      >
                        Show more
                      </button>
                    )}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 border">
                {issue.reporterTeam || ""} {issue.reporter ? `(${issue.reporter})` : ""}
              </td>
              {includeActions && (
                <td className="px-4 py-3 border space-x-2">
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md shadow-md"
                    onClick={() => markValid(issue)}
                  >
                    Mark Valid
                  </button>
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md shadow-md"
                    onClick={() => markInvalid(issue)}
                  >
                    Mark Invalid
                  </button>
                </td>
              )}
              <td className="px-4 py-3 border">
                {issue.createdAt ? new Date(issue.createdAt).toLocaleString() : "-"}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
=======
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center bg-slate-800 p-8 rounded-xl shadow-xl">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-white mb-2">Loading Issues</h3>
          <p className="text-slate-400">Please wait while we fetch the latest data...</p>
        </div>
      </div>
    );
  }
>>>>>>> origin/main

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-xl shadow-xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Error Loading Issues</h3>
            <p className="text-slate-400 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">
            Manipal Hackathon '25 Bug Bounty Tracker
          </h1>
          <p className="text-slate-400">
            Track and manage bug reports with detailed analysis • Auto-refreshes every 15 seconds
          </p>
        </div>
      </header>

      {/* Stats */}
      <section className="bg-slate-800 border-b border-slate-700 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            
            <div className="bg-slate-700 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{issues.length}</div>
              <div className="text-slate-400 text-sm">Pending Review</div>
            </div>
            
            <div className="bg-slate-700 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">{validIssues.length}</div>
              <div className="text-slate-400 text-sm">Valid Issues</div>
            </div>
            
            <div className="bg-slate-700 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-red-400 mb-2">{invalidIssues.length}</div>
              <div className="text-slate-400 text-sm">Invalid Issues</div>
            </div>
            
            <div className="bg-slate-700 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">{issuelessRepos.length}</div>
              <div className="text-slate-400 text-sm">Clean Repos</div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Export Controls */}
      <section className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-end gap-3">
          <button
            onClick={() => exportCSV(validIssues, "valid_issues.csv")}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Export Valid
          </button>
          <button
            onClick={() => exportCSV(invalidIssues, "invalid_issues.csv")}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Export Invalid
          </button>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-12">
        
        {/* Pending Issues */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Pending Issues</h2>
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              {issues.length} issues
            </span>
          </div>
          
          {issues.length === 0 ? (
            <div className="bg-slate-800 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">✓</div>
              <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
              <p className="text-slate-400">No pending issues to review.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {issues.map((issue) => (
                <div 
                  key={issue.id} 
                  className="bg-slate-800 rounded-lg p-6 hover:bg-slate-700 cursor-pointer transition-colors"
                  onClick={() => openIssueModal(issue)}
                >
                  <div className="flex items-start gap-6">
                    <NetworkImageWidget issue={issue} size="lg" />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-white mb-3">
                        {issue.title || "(No title)"}
                      </h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-slate-400">Repository:</span>
                          <div className="text-white font-medium">{issue.repo || "Unknown"}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Team:</span>
                          <div className="text-white font-medium">{issue.reporterTeam || "Unknown"}</div>
                        </div>
                        {issue.reporter && (
                          <div>
                            <span className="text-slate-400">Reporter:</span>
                            <div className="text-white font-medium">@{issue.reporter}</div>
                          </div>
                        )}
                        {issue.createdAt && (
                          <div>
                            <span className="text-slate-400">Created:</span>
                            <div className="text-white font-medium">
                              {new Date(issue.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {extractAllImagesFromContent(issue.body || issue.description || issue.content).length > 0 && (
                        <div className="inline-flex items-center bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
                          📸 {extractAllImagesFromContent(issue.body || issue.description || issue.content).length} images
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Valid Issues */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">✅ Valid Issues</h2>
            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              {validIssues.length} issues
            </span>
          </div>
          
          {validIssues.length === 0 ? (
            <div className="bg-slate-800 rounded-lg p-8 text-center text-slate-400">
              No valid issues yet
            </div>
          ) : (
            <div className="grid gap-4">
              {validIssues.map((issue) => (
                <div 
                  key={issue.id} 
                  className="bg-slate-800 rounded-lg p-4 hover:bg-slate-700 cursor-pointer transition-colors"
                  onClick={() => openIssueModal(issue)}
                >
                  <div className="flex items-center gap-4">
                    <NetworkImageWidget issue={issue} size="md" />
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white mb-1">
                        {issue.title || "(No title)"}
                      </div>
                      <div className="text-sm text-slate-400">
                        {issue.repo || issue.name} • {issue.reporterTeam || "Unknown team"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Invalid Issues */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">❌ Invalid Issues</h2>
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              {invalidIssues.length} issues
            </span>
          </div>
          
          {invalidIssues.length === 0 ? (
            <div className="bg-slate-800 rounded-lg p-8 text-center text-slate-400">
              No invalid issues yet
            </div>
          ) : (
            <div className="grid gap-4">
              {invalidIssues.map((issue) => (
                <div 
                  key={issue.id} 
                  className="bg-slate-800 rounded-lg p-4 hover:bg-slate-700 cursor-pointer transition-colors"
                  onClick={() => openIssueModal(issue)}
                >
                  <div className="flex items-center gap-4">
                    <NetworkImageWidget issue={issue} size="md" />
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white mb-1">
                        {issue.title || "(No title)"}
                      </div>
                      <div className="text-sm text-slate-400">
                        {issue.repo || issue.name} • {issue.reporterTeam || "Unknown team"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Clean Repositories */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">🧹 Clean Repositories</h2>
            <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              {issuelessRepos.length} repos
            </span>
          </div>
          
          {issuelessRepos.length === 0 ? (
            <div className="bg-slate-800 rounded-lg p-8 text-center text-slate-400">
              No clean repositories found
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {issuelessRepos.map((repo) => (
                <div key={repo.name} className="bg-slate-800 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">📁</div>
                  <div className="font-semibold text-white mb-1">{repo.name}</div>
                  <div className="text-sm text-slate-400">No issues</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Issue Detail Modal */}
      <IssueDetailModal
        issue={selectedIssue}
        isOpen={isModalOpen}
        onClose={closeIssueModal}
        onMarkValid={markValid}
        onMarkInvalid={markInvalid}
      />
    </div>
  );
}
