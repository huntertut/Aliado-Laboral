const jwt = require('jsonwebtoken');

const token = jwt.sign({ userId: 'test', role: 'admin' }, 'secret', { expiresIn: '1h' });

try {
  jwt.verify(token, 'secret');
  console.log('Verification with same secret SUCCESS');
} catch(e) {
  console.log('Verification failed', e);
}

try {
  jwt.verify(token, 'WRONG_SECRET');
  console.log('Verification with WRONG secret SUCCESS');
} catch(e) {
  console.log('Verification with WRONG secret FAILED', e.message);
}
