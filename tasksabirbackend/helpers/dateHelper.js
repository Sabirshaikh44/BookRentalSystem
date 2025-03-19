const formatDate = (dateStr) => {
    const [day, month, year] = dateStr.split('/');
    return new Date(`${month}/${day}/${year}`);
  };

module.exports = formatDate;