import { DataPrepWorkflow } from '@/components/dataprep/DataPrepWorkflow';
import { useProjects } from '@/contexts/ProjectContext';

const DataPreparation = () => {
  const { currentProject } = useProjects();

  if (!currentProject || currentProject.tool_type !== 'data_preparation') {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Please select or create a Data project to begin
        </p>
      </div>
    );
  }

  return <DataPrepWorkflow project={currentProject} />;
};

export default DataPreparation;
