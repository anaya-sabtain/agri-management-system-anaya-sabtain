(async () => {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@agrisense.com', password: 'Admin@123' })
  });
  const loginData = await loginRes.json();
  console.log('Login response:', loginData);
  const token = loginData?.token || loginData?.data?.token || loginData?.user?.token;
  if (!token) {
    console.error('No token received');
    return;
  }
  const actRes = await fetch('http://localhost:5000/api/activities', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const actData = await actRes.json();
  console.log('Activities response:', actData);
})();
