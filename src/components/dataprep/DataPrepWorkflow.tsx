import { DataPipelineWorkflow } from './DataPipelineWorkflow';

interface DataPrepWorkflowProps {
  project: any;
}

export const DataPrepWorkflow = ({ project }: DataPrepWorkflowProps) => {
  return <DataPipelineWorkflow project={project} />;
};
