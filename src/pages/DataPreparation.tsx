import { useState } from 'react';
import { ProjectScenarioNav } from '@/components/ProjectScenarioNav';
import { DataPrepWorkflow } from '@/components/dataprep/DataPrepWorkflow';
import { useProjects } from '@/contexts/ProjectContext';

const DataPreparation = () => {
  const { currentProject } = useProjects();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <ProjectScenarioNav moduleType="data_preparation" moduleName="Data Preparation" />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
            AI-Driven Data Preparation
          </h1>
          <p className="text-muted-foreground">
            Transform raw data into analysis-ready format using conversational AI. 
            Reduce data preparation time by 60% with intelligent SQL generation and tracking.
          </p>
        </div>

        {currentProject ? (
          <DataPrepWorkflow project={currentProject} />
        ) : (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Please create a Data Preparation project to begin</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DataPreparation;
