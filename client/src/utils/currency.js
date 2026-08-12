export const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatNumber = (value) => new Intl.NumberFormat('en-IN').format(Number(value) || 0);
