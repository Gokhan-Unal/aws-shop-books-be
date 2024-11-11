export const basicAuthorizer = async (event, context) => {
  const { authorization } = event.headers;
  if (!authorization) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Authorization header not provided' }),
    };
  }

  const encodedCredentials = authorization.split(' ')[1];
  const buff = Buffer.from(encodedCredentials, 'base64');
  const [login, password] = buff.toString('utf8').split(':');

  if (process.env[login] === password) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Access granted' }),
    };
  } else {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: 'Access denied' }),
    };
  }
};
