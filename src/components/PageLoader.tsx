import React from 'react';
import BikeLoader from './BikeLoader';

const PageLoader: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="h-full min-h-[50vh] w-full flex items-center justify-center py-10">
      <BikeLoader message={message} />
    </div>
  );
};

export default PageLoader;
