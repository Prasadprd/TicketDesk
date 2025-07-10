import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
// You can swap Chart.js with Recharts if you prefer
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';

const Dashboard = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [projectStats, setProjectStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Redirect to login if no token
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [overviewRes, distRes, projRes] = await Promise.all([
          api.get('/dashboard/overview'),
          api.get('/dashboard/ticket-distribution'),
          api.get('/dashboard/project-stats'),
        ]);
        setOverview(overviewRes.data);
        setDistribution(distRes.data);
        setProjectStats(projRes.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      }
      setLoading(false);
    };
    fetchData();
  }, [navigate]);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div style={{color:'red'}}>Error: {error}</div>;

  return (
    <div style={{padding: 24}}>
      <h2>Dashboard Overview</h2>
      <div style={{display:'flex', gap:24, marginBottom:32}}>
        <div style={{background:'#f5f5f5', padding:16, borderRadius:8}}>
          <div>Users</div>
          <div style={{fontSize:24, fontWeight:'bold'}}>{overview.users}</div>
        </div>
        <div style={{background:'#f5f5f5', padding:16, borderRadius:8}}>
          <div>Projects</div>
          <div style={{fontSize:24, fontWeight:'bold'}}>{overview.projects}</div>
        </div>
        <div style={{background:'#f5f5f5', padding:16, borderRadius:8}}>
          <div>Tickets</div>
          <div style={{fontSize:24, fontWeight:'bold'}}>{overview.tickets}</div>
        </div>
        <div style={{background:'#f5f5f5', padding:16, borderRadius:8}}>
          <div>Teams</div>
          <div style={{fontSize:24, fontWeight:'bold'}}>{overview.teams}</div>
        </div>
      </div>

      <h3>Ticket Distribution</h3>
      <div style={{display:'flex', gap:32, flexWrap:'wrap'}}>
        <div style={{width:300}}>
          <h4>Status</h4>
          <Pie data={{
            labels: distribution.byStatus.map(s=>s._id),
            datasets: [{
              data: distribution.byStatus.map(s=>s.count),
              backgroundColor: ['#36A2EB','#FF6384','#FFCE56','#4BC0C0','#9966FF','#FF9F40'],
            }],
          }} />
        </div>
        <div style={{width:300}}>
          <h4>Priority</h4>
          <Doughnut data={{
            labels: distribution.byPriority.map(s=>s._id),
            datasets: [{
              data: distribution.byPriority.map(s=>s.count),
              backgroundColor: ['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#9966FF','#FF9F40'],
            }],
          }} />
        </div>
        <div style={{width:300}}>
          <h4>Type</h4>
          <Pie data={{
            labels: distribution.byType.map(s=>s._id),
            datasets: [{
              data: distribution.byType.map(s=>s.count),
              backgroundColor: ['#FFCE56','#36A2EB','#FF6384','#4BC0C0','#9966FF','#FF9F40'],
            }],
          }} />
        </div>
      </div>

      <h3 style={{marginTop:40}}>Tickets per Project</h3>
      <div style={{width:600}}>
        <Bar data={{
          labels: projectStats.map(p=>p.project),
          datasets: [{
            label: 'Tickets',
            data: projectStats.map(p=>p.count),
            backgroundColor: '#36A2EB',
          }],
        }} />
      </div>
    </div>
  );
};

export default Dashboard;
