let accessToken = '';
let sessionVersion = 0;

export const authSession = {
  getAccessToken: () => accessToken,
  getVersion: () => sessionVersion,
  setAccessToken: (token: string) => {
    accessToken = token;
  },
  clear: () => {
    sessionVersion += 1;
    accessToken = '';
  }
};
