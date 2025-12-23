import { useParams } from 'react-router-dom';

export const GroupDetailPage = () => {
  const { id } = useParams();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Group Details</h1>
      <p className="text-gray-600">Group ID: {id}</p>
    </div>
  );
};

