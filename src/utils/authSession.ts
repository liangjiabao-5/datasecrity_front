let accessToken = '';

export const authSession = {
  getAccessToken: () => accessToken,
  setAccessToken: (token: string) => {
    accessToken = token;
  },
  clear: () => {
    accessToken = '';
  }
};
