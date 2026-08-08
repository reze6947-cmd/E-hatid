const ExploreContainer: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8">
      <strong className="text-base sm:text-xl font-semibold mb-3 sm:mb-4 text-center">Ready to create an app?</strong>
      <p className="text-xs sm:text-sm text-[var(--ion-text-color-secondary)] text-center">
        Start with Ionic{' '}
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://ionicframework.com/docs/components"
          className="text-[var(--ion-color-primary)] font-medium hover:underline"
        >
          UI Components
        </a>
      </p>
    </div>
  );
};

export default ExploreContainer;
