import { useParams } from 'react-router-dom';

export const EventDetailPage = () => {
  const { id } = useParams();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Event Details</h1>
      <p className="text-gray-600">Event ID: {id}</p>
    </div>
  );
};

