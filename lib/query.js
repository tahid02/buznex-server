const insertData = async (collectionName, dataToPost) => {
  try {
    await collectionName.insertOne(dataToPost).then((result) => {
      // console.log('inserted count', result.insertedCount);
      return result.insertedCount > 0;
    });
  } catch (error) {
    return { error };
  }
};

const findFilteredData = async (collectionName, query, filterQuery) => {
  try {
    await collectionName
      .findOne({ query, filterQuery })
      .toArray((err, data) => {
        return data;
      });
  } catch (error) {
    return { error };
  }
};

module.exports = { insertData, findFilteredData };
