import React from 'react';
import Head from 'next/head';
import { IroningBeadsPage, IroningBeadsErrorBoundary } from '@/components/ironingBeads/IroningBeadsPage';

const IroningBeadsPageWrapper: React.FC = () => {
    return (
        <>
            <Head>
                <title>Ironing Beads Designer | Boskind Digital</title>
                <meta
                    name="description"
                    content="Create and design pixel art patterns for Perler beads with our intuitive online designer. Save multiple projects and bring your bead art to life."
                />
                <meta name="keywords" content="perler beads, ironing beads, pixel art, bead patterns, craft design, digital art" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Ironing Beads Designer | Boskind Digital" />
                <meta property="og:description" content="Create and design pixel art patterns for Perler beads with our intuitive online designer." />
                <meta property="og:url" content="https://boskind.tech/ironingBeads" />

                {/* Twitter */}
                <meta property="twitter:card" content="summary_large_image" />
                <meta property="twitter:title" content="Ironing Beads Designer | Boskind Digital" />
                <meta property="twitter:description" content="Create and design pixel art patterns for Perler beads with our intuitive online designer." />

                {/* Favicon */}
                <link rel="icon" href="/favicon.ico" />

                {/* Preload critical resources */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </Head>

            <IroningBeadsErrorBoundary>
                <IroningBeadsPage />
            </IroningBeadsErrorBoundary>
        </>
    );
};

export default IroningBeadsPageWrapper;