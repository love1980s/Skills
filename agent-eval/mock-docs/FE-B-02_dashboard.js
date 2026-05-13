// 仪表盘数据加载模块
// 这段代码运行后控制台一直报错，帮我找一下哪里有问题

async function loadDashboardData(userId) {
  // 【Bug1】fetchUserProfile 是 async 函数返回 Promise，这里漏写了 await
  // userInfo 拿到的是 Promise 对象，而不是实际的用户数据
  const userInfo = fetchUserProfile(userId);

  const orders = await fetchOrders(userId);

  // 下面这行会报错：Cannot read properties of undefined (reading 'name')
  // 因为 userInfo 是 Promise，不是对象
  const displayName = userInfo.name + '（' + userInfo.email + '）';

  // 【Bug2】fetch 没有 .catch() 也没有 try/catch
  // 网络失败时 Promise rejection 没有被处理，会产生 UnhandledPromiseRejection
  const statsRes = await fetch('/api/stats/' + userId);
  const stats = await statsRes.json();

  // 【Bug3】stats 实际返回的是 { data: [...], total: N } 结构
  // 直接对 stats 调用 .map() 会报 TypeError: stats.map is not a function
  const summary = stats.map((item) => ({
    label: item.category,
    value: item.total,
    percent: ((item.total / stats.total) * 100).toFixed(1) + '%',
  }));

  return {
    user: displayName,
    orderCount: orders.length,
    summary,
  };
}

async function fetchUserProfile(id) {
  const res = await fetch('/api/users/' + id);
  if (!res.ok) throw new Error('用户不存在');
  return res.json();
}

async function fetchOrders(userId) {
  const res = await fetch('/api/orders?userId=' + userId);
  return res.json();
}

// 入口调用
loadDashboardData(123).then((result) => {
  console.log('Dashboard loaded:', result);
});
