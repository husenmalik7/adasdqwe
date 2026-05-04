import GridCanvas from '@/components/GridCanvas';

const Index = () => {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <h1 className="sr-only">Zoomable 1920x1080 Coordinate Grid</h1>
      <GridCanvas />
    </main>
  );
};

export default Index;
