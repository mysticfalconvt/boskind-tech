import React from 'react';
import { ProjectListView } from '@/components/ironingBeads/ProjectListView';
import { IroningBeadsErrorBoundary } from '@/components/ironingBeads/IroningBeadsPage';

const IroningBeadsIndexPage: React.FC = () => {
  return (
    <IroningBeadsErrorBoundary>
      <ProjectListView />
    </IroningBeadsErrorBoundary>
  );
};

export default IroningBeadsIndexPage;