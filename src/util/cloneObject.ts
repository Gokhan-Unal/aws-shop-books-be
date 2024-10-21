export const cloneObject = (source: any, keysToRemove: string[] = []) => {
  const clonedObject = Object.assign({}, source);

  keysToRemove.forEach((key) => {
    delete clonedObject[key];
  });

  return clonedObject;
};
