'use client';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'primary';
}

export function Button({ 
  children, 
  onClick, 
  type = 'button', 
  disabled,
  className = '',
  variant = 'default'
}: ButtonProps) {
  const baseStyles = "w-full px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    default: "bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700",
    primary: "bg-blue-600 text-white hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
} 