import type { InterviewAnalyticsDashboardData } from '@/types/interview-analytics'

export const interviewAnalyticsDemoData: InterviewAnalyticsDashboardData = {
  metrics: [
    {
      key: 'mock-count',
      label: '累计面试',
      value: '28 场',
      trendText: '较上周 +18%',
      tone: 'blue'
    },
    {
      key: 'practice-time',
      label: '训练时长',
      value: '42.5 h',
      trendText: '近 7 天 6.5 h',
      tone: 'green'
    },
    {
      key: 'average-score',
      label: '平均评分',
      value: '82 分',
      trendText: '连续 4 次提升',
      tone: 'orange'
    },
    {
      key: 'streak-days',
      label: '连续训练',
      value: '9 天',
      trendText: '保持节奏',
      tone: 'red'
    }
  ],
  abilityRadar: [
    {
      name: '表达能力',
      value: 82,
      max: 100
    },
    {
      name: '逻辑结构',
      value: 76,
      max: 100
    },
    {
      name: '专业知识',
      value: 88,
      max: 100
    },
    {
      name: '岗位匹配',
      value: 79,
      max: 100
    },
    {
      name: '抗压能力',
      value: 70,
      max: 100
    },
    {
      name: '复盘吸收',
      value: 84,
      max: 100
    }
  ],
  scoreTrend: [
    {
      label: '第 1 次',
      score: 68
    },
    {
      label: '第 2 次',
      score: 72
    },
    {
      label: '第 3 次',
      score: 73
    },
    {
      label: '第 4 次',
      score: 78
    },
    {
      label: '第 5 次',
      score: 80
    },
    {
      label: '第 6 次',
      score: 83
    },
    {
      label: '第 7 次',
      score: 86
    }
  ],
  questionTypeDistribution: [
    {
      name: '技术题',
      value: 36
    },
    {
      name: '项目题',
      value: 28
    },
    {
      name: '行为题',
      value: 18
    },
    {
      name: '开放题',
      value: 10
    },
    {
      name: '压力题',
      value: 8
    }
  ],
  jobPracticeDistribution: [
    {
      name: '前端',
      value: 42
    },
    {
      name: '后端',
      value: 20
    },
    {
      name: '算法',
      value: 14
    },
    {
      name: '产品',
      value: 12
    },
    {
      name: '运营',
      value: 8
    }
  ],
  weaknessRanking: [
    {
      name: '结构表达',
      value: 12,
      detail: '回答层次和结论前置需要加强',
      tone: 'orange'
    },
    {
      name: '性能优化',
      value: 9,
      detail: '案例指标和排查路径还不够完整',
      tone: 'red'
    },
    {
      name: '原理追问',
      value: 7,
      detail: '响应式、构建链路等追问需复盘',
      tone: 'blue'
    }
  ],
  trainingHeatmap: [
    {
      date: '2026-06-23',
      label: '06-23',
      value: 1
    },
    {
      date: '2026-06-24',
      label: '06-24',
      value: 2
    },
    {
      date: '2026-06-25',
      label: '06-25',
      value: 0
    },
    {
      date: '2026-06-26',
      label: '06-26',
      value: 3
    },
    {
      date: '2026-06-27',
      label: '06-27',
      value: 1
    },
    {
      date: '2026-06-28',
      label: '06-28',
      value: 4
    },
    {
      date: '2026-06-29',
      label: '06-29',
      value: 2
    },
    {
      date: '2026-06-30',
      label: '06-30',
      value: 1
    },
    {
      date: '2026-07-01',
      label: '07-01',
      value: 3
    },
    {
      date: '2026-07-02',
      label: '07-02',
      value: 0
    },
    {
      date: '2026-07-03',
      label: '07-03',
      value: 2
    },
    {
      date: '2026-07-04',
      label: '07-04',
      value: 4
    },
    {
      date: '2026-07-05',
      label: '07-05',
      value: 3
    },
    {
      date: '2026-07-06',
      label: '07-06',
      value: 2
    }
  ],
  activityFeed: [
    {
      id: 'activity-1',
      title: '完成一场模拟面试',
      description: '前端工程化方向，评分 86 分',
      timeText: '刚刚',
      type: 'mock'
    },
    {
      id: 'activity-2',
      title: '生成专项补练题',
      description: '围绕状态管理与性能优化生成 8 题',
      timeText: '18 分钟前',
      type: 'practice'
    },
    {
      id: 'activity-3',
      title: '查看复盘报告',
      description: '新增 3 个弱项标签',
      timeText: '1 小时前',
      type: 'report'
    }
  ]
}
