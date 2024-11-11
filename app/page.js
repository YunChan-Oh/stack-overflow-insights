"use client";

import { useEffect, useState, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import * as d3 from 'd3';
import { Container, Typography, Grid, Paper, CircularProgress, Alert, AlertTitle, Button } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

Chart.register(...registerables);

const StackOverflowDataViz = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRefs = useRef({});

  useEffect(() => {
    loadData();
    return () => {
      Object.values(chartRefs.current).forEach(chart => chart.destroy());
    };
  }, []);

  useEffect(() => {
    if (data) {
      console.log('Raw data:', data);
      createCharts(data);
    }
  }, [data]);

  const loadData = () => {
    setIsLoading(true);
    setError(null);

    d3.csv('/data/survey_results_public.csv')
      .then((loadedData) => {
        if (loadedData.length === 0) {
          throw new Error('CSV 파일이 비어있거나 올바르게 파싱할 수 없습니다.');
        }
        console.log('Loaded data:', loadedData);
        setData(loadedData);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('데이터 로딩 실패:', err);
        setError('데이터를 불러오는 데 실패했습니다. 나중에 다시 시도해주세요.');
        setIsLoading(false);
      });
  };

  const createCharts = (loadedData) => {
    console.log('Creating charts with data:', loadedData);
    const charts = [
      { id: 'language-chart', type: 'bar', title: '프로그래밍 언어 인기도' },
      { id: 'employment-chart', type: 'pie', title: '고용 상태' },
      { id: 'education-chart', type: 'pie', title: '교육 수준' },
      { id: 'salary-chart', type: 'bar', title: '급여 분포' },
      { id: 'remote-chart', type: 'doughnut', title: '원격 근무 현황' }
    ];

    charts.forEach((chart) => {
      const ctx = document.getElementById(chart.id);
      if (!ctx) {
        console.error(`ID가 '${chart.id}'인 캔버스 요소를 찾을 수 없습니다.`);
        return;
      }

      let chartData;
      let options;

      switch (chart.id) {
        case 'language-chart':
          chartData = getLanguageChartData(loadedData);
          options = {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: { display: true, text: chart.title, font: { size: 16 } }
            }
          };
          break;
        case 'employment-chart':
          chartData = getEmploymentChartData(loadedData);
          options = getPieChartOptions(chart.title);
          break;
        case 'education-chart':
          chartData = getEducationChartData(loadedData);
          options = getPieChartOptions(chart.title);
          break;
        case 'salary-chart':
          chartData = getSalaryChartData(loadedData);
          options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: { display: true, text: chart.title, font: { size: 16 } }
            },
            scales: {
              x: { title: { display: true, text: '급여 (USD)' } },
              y: { title: { display: true, text: '빈도' } }
            }
          };
          break;
        case 'remote-chart':
          chartData = getRemoteChartData(loadedData);
          options = getPieChartOptions(chart.title);
          break;
        default:
          console.error(`ID '${chart.id}'에 대한 차트 구성을 찾을 수 없습니다.`);
          return;
      }

      console.log(`Chart data for ${chart.id}:`, chartData);
      console.log(`Chart options for ${chart.id}:`, options);

      if (chartRefs.current[chart.id]) {
        chartRefs.current[chart.id].destroy();
      }

      chartRefs.current[chart.id] = new Chart(ctx, {
        type: chart.type,
        data: chartData,
        options: options
      });
    });
  };

  const getLanguageChartData = (data) => {
    console.log('Processing language data');
    const languages = {};
    data.forEach((row) => {
      const langList = row.LanguageHaveWorkedWith?.split(';') || [];
      langList.forEach((lang) => {
        languages[lang] = (languages[lang] || 0) + 1;
      });
    });
    console.log('Language counts:', languages);
    const sortedLanguages = Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    console.log('Top 10 languages:', sortedLanguages);
    return {
      labels: sortedLanguages.map(([lang]) => lang),
      datasets: [{
        data: sortedLanguages.map(([, count]) => count),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    };
  };

  const getEmploymentChartData = (data) => {
    console.log('Processing employment data');
    const employmentStatus = {};
    data.forEach((row) => {
      const status = row.Employment;
      if (status) {
        employmentStatus[status] = (employmentStatus[status] || 0) + 1;
      }
    });
    console.log('Employment status counts:', employmentStatus);
    return {
      labels: Object.keys(employmentStatus),
      datasets: [{
        data: Object.values(employmentStatus),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ]
      }]
    };
  };

  const getEducationChartData = (data) => {
    console.log('Processing education data');
    const educationLevels = {};
    data.forEach((row) => {
      const edLevel = row.EdLevel;
      if (edLevel) {
        educationLevels[edLevel] = (educationLevels[edLevel] || 0) + 1;
      }
    });
    console.log('Education level counts:', educationLevels);
    return {
      labels: Object.keys(educationLevels),
      datasets: [{
        data: Object.values(educationLevels),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ]
      }]
    };
  };

  const getSalaryChartData = (data) => {
    console.log('Processing salary data');
    const salaries = data
      .map((row) => parseFloat(row.ConvertedCompYearly))
      .filter((value) => !isNaN(value) && value > 0 && value < 300000);
    console.log('Filtered salaries:', salaries);
    const bins = d3.histogram().thresholds(20)(salaries);
    console.log('Salary bins:', bins);
    return {
      labels: bins.map(b => `${Math.round(b.x0 / 1000)}k-${Math.round(b.x1 / 1000)}k`),
      datasets: [{
        data: bins.map(b => b.length),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    };
  };

  const getRemoteChartData = (data) => {
    console.log('Processing remote work data');
    const remoteWorkStatus = {};
    data.forEach((row) => {
      const remote = row.RemoteWork;
      if (remote) {
        remoteWorkStatus[remote] = (remoteWorkStatus[remote] || 0) + 1;
      }
    });
    console.log('Remote work status counts:', remoteWorkStatus);
    return {
      labels: Object.keys(remoteWorkStatus),
      datasets: [{
        data: Object.values(remoteWorkStatus),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)'
        ]
      }]
    };
  };

  const getPieChartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' },
      title: { display: true, text: title, font: { size: 16 } }
    }
  });

  // ... (나머지 코드는 변경 없음)

  return (
    <>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          align="center"
          sx={{
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 4
          }}
        >
          Stack Overflow 개발자 설문조사 인사이트
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} lg={6}>
            <Paper elevation={3} sx={{ p: 3, height: '400px' }}>
              <canvas id="language-chart" style={{ width: '100%', height: '100%' }}></canvas>
            </Paper>
          </Grid>
          <Grid item xs={12} lg={6}>
            <Paper elevation={3} sx={{ p: 3, height: '400px' }}>
              <canvas id="employment-chart" style={{ width: '100%', height: '100%' }}></canvas>
            </Paper>
          </Grid>
          <Grid item xs={12} lg={6}>
            <Paper elevation={3} sx={{ p: 3, height: '400px' }}>
              <canvas id="education-chart" style={{ width: '100%', height: '100%' }}></canvas>
            </Paper>
          </Grid>
          <Grid item xs={12} lg={6}>
            <Paper elevation={3} sx={{ p: 3, height: '400px' }}>
              <canvas id="salary-chart" style={{ width: '100%', height: '100%' }}></canvas>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, height: '400px' }}>
              <canvas id="remote-chart" style={{ width: '100%', height: '100%' }}></canvas>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default StackOverflowDataViz;