import { Canvas } from '@react-three/fiber';
import { Leva } from 'leva';
import { Experience } from './Experience';
import { Overlay } from './Overlay';
import { SlideProvider } from './SlideContext';

function App() {
  return (
    <SlideProvider>
      <Leva />
      <Overlay />
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 30 }}>
        <color attach="background" args={['#ececec']} />
        <Experience />
      </Canvas>
    </SlideProvider>
  );
}

export default App;
