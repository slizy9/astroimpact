import { M } from './motion';

export function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0A0F2C] text-white">
      <M.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00BFFF] mx-auto"></div>
        </div>
        <h2 className="text-xl font-semibold text-[#00BFFF] mb-2">IMPACTOR 2025</h2>
        <p className="text-gray-300">{message}</p>
      </M.div>
    </div>
  );
}

export default LoadingSpinner;
