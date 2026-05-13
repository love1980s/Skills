// 用户列表组件 - 请帮我 review 这段代码
import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
}

interface UserListProps {
  filter: string;
  pageSize: number;
}

// 【问题1】子组件未做 memo 处理，每次父组件 re-render 都会重新渲染
const UserCard = ({ user, onSelect }: { user: User; onSelect: () => void }) => {
  console.log('UserCard render:', user.id);
  return (
    <div className="user-card" onClick={onSelect}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <span className={`badge ${user.status}`}>{user.role}</span>
    </div>
  );
};

const UserList: React.FC<UserListProps> = ({ filter, pageSize }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);

  // 【问题2】useEffect 缺少依赖数组，每次 render 都会触发请求
  useEffect(() => {
    setLoading(true);
    fetch(`/api/users?filter=${filter}&size=${pageSize}`)
      .then((r) => r.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      });
  });

  const handleSelectAll = () => {
    setSelected(users.map((u) => u.id));
  };

  return (
    // 【问题3】内联 style 对象每次 render 都创建新引用，导致不必要的重渲染
    <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h2>用户列表</h2>
        <button onClick={handleSelectAll}>全选</button>
      </div>
      {loading && <p>加载中...</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {users.map((user) => (
          // 【问题4】列表项缺少 key，且 onSelect 使用内联箭头函数导致每次 render 都是新函数引用
          <li>
            <UserCard
              user={user}
              onSelect={() => setSelected((prev) => [...prev, user.id])}
            />
          </li>
        ))}
      </ul>
      <p>已选择 {selected.length} 个用户</p>
    </div>
  );
};

export default UserList;
