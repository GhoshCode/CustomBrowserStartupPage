import { Backdrop } from './components/Backdrop';
import { CategoryGrid } from './components/CategoryGrid';
import { Header } from './components/Header';
import { QuickLinks } from './components/QuickLinks';

export default function App() {
  return (
    <>
      <Backdrop />
      <div className="flex min-h-dvh flex-col">
        <Header />
        <QuickLinks />
        <CategoryGrid />
      </div>
    </>
  );
}
