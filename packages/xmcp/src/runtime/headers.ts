const data = {
  name: "test",
};

export const setTestData = (name: string) => {
  data.name = name;
};

export const headers = () => data;
