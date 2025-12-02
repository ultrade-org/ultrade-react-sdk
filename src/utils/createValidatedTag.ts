export const createValidatedTag = <T extends Array<unknown>>(data: T) => {
  return data.filter(el => el || el === 0).join("-");
}

export const createPairListTag = <T extends string>(tagName: T, companyId?: number) => {
  return [companyId || companyId === 0 ? { type: tagName, id: companyId } : { type: tagName }] as const;
}