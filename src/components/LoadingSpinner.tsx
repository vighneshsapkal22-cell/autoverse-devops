export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${dims[size]} border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin`} />
  );
}
