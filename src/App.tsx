import { Backdrop } from './components/Backdrop';
import { Header } from './components/Header';

export default function App() {
  return (
    <>
      <Backdrop />
      <div className="flex min-h-dvh flex-col">
        <Header />
      </div>
    </>
  );
}
