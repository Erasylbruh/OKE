import React from 'react';

/**
 * Reusable Loading Skeleton Components
 * Provides visual feedback during data loading
 */

// Pulse animation keyframes
const pulseStyle = {
    animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
};

// Base skeleton element
const SkeletonBox = ({ width = '100%', height = '20px', style = {} }) => (
    <div
        style={{
            width,
            height,
            backgroundColor: 'var(--bg-hover)',
            borderRadius: '8px',
            ...pulseStyle,
            ...style
        }}
    />
);

// Project Card Skeleton
export const ProjectCardSkeleton = () => (
    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Preview Image Skeleton */}
        <SkeletonBox height="200px" style={{ borderRadius: '16px 16px 0 0' }} />

        {/* Content Area */}
        <div style={{ padding: '20px' }}>
            {/* Title */}
            <SkeletonBox width="70%" height="24px" style={{ marginBottom: '12px' }} />

            {/* User Info Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <SkeletonBox width="32px" height="32px" style={{ borderRadius: '50%' }} />
                <SkeletonBox width="120px" height="16px" />
            </div>

            {/* Stats Row */}
            <div style={{ display: 'flex', gap: '20px' }}>
                <SkeletonBox width="60px" height="16px" />
                <SkeletonBox width="60px" height="16px" />
            </div>
        </div>
    </div>
);

// User Profile Skeleton
export const UserProfileSkeleton = () => (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
            <SkeletonBox width="120px" height="120px" style={{ borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
                <SkeletonBox width="200px" height="32px" style={{ marginBottom: '10px' }} />
                <SkeletonBox width="150px" height="20px" style={{ marginBottom: '15px' }} />
                <div style={{ display: 'flex', gap: '20px' }}>
                    <SkeletonBox width="80px" height="20px" />
                    <SkeletonBox width="80px" height="20px" />
                </div>
            </div>
        </div>

        {/* Projects Grid */}
        <div className="grid-3" style={{ marginTop: '30px' }}>
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
        </div>
    </div>
);

// Editor Skeleton
export const EditorSkeleton = () => (
    <div style={{ height: '100vh', display: 'flex', backgroundColor: 'var(--bg-main)' }}>
        {/* Left Panel */}
        <div style={{ width: '350px', borderRight: '1px solid var(--border-color)', padding: '20px' }}>
            <SkeletonBox width="120px" height="120px" style={{ borderRadius: '50%', margin: '0 auto 20px' }} />
            <SkeletonBox width="100%" height="40px" style={{ marginBottom: '15px' }} />
            <SkeletonBox width="100%" height="150px" style={{ marginBottom: '15px' }} />
            <SkeletonBox width="100%" height="40px" style={{ marginBottom: '10px' }} />
            <SkeletonBox width="100%" height="40px" style={{ marginBottom: '10px' }} />
        </div>

        {/* Center Panel */}
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <SkeletonBox width="80%" height="60px" style={{ marginBottom: '30px' }} />
            <SkeletonBox width="70%" height="40px" style={{ marginBottom: '20px' }} />
            <SkeletonBox width="60%" height="40px" style={{ marginBottom: '20px' }} />
            <SkeletonBox width="75%" height="40px" />
        </div>

        {/* Right Panel */}
        <div style={{ width: '350px', borderLeft: '1px solid var(--border-color)', padding: '20px' }}>
            <SkeletonBox width="100%" height="30px" style={{ marginBottom: '20px' }} />
            <SkeletonBox width="100%" height="50px" style={{ marginBottom: '15px' }} />
            <SkeletonBox width="100%" height="50px" style={{ marginBottom: '15px' }} />
            <SkeletonBox width="100%" height="50px" />
        </div>
    </div>
);

// Generic Grid Skeleton
export const GridSkeleton = ({ count = 6, CardComponent = ProjectCardSkeleton }) => (
    <div className="grid-3">
        {Array.from({ length: count }).map((_, index) => (
            <CardComponent key={index} />
        ))}
    </div>
);

// Add pulse animation to global styles
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  `;
    document.head.appendChild(style);
}

export default {
    ProjectCardSkeleton,
    UserProfileSkeleton,
    EditorSkeleton,
    GridSkeleton
};
