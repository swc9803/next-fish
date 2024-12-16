import { createContext, useContext, useState } from 'react';

const SlideContext = createContext();

export const SlideProvider = ({ children }) => {
  const [slide, setSlide] = useState(0);

  return (
    <SlideContext.Provider value={{ slide, setSlide }}>{children}</SlideContext.Provider>
  );
};

export const useSlide = () => useContext(SlideContext);
