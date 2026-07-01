export interface SceneTheme {
  line: string
  dot: string
  activeDot: string
  primary: string
  secondary: string
  planet: string
  planetGlow: string
  planetShadow: string
  atmosphere: string
  ring: string
}

export interface SceneItem {
  id: string
  navLabel: string
  eyebrow: string
  title: string
  summary: string
  bullets: string[]
  sectionTitle: string
  sectionBody: string
  theme: SceneTheme
  shellBackground: string
  glowA: string
  glowB: string
  nebula: string
  planetSize: string
  planetRight: string
  planetBottom: string
}

export const scenes: SceneItem[] = [
  {
    id: 'overview',
    navLabel: '总览',
    eyebrow: 'Interview constellation',
    title: '面试总览',
    summary: '把复杂的模拟面试流程压缩成一个更沉浸、更纯粹的宇宙式首页，先看到目标，再进入作答。',
    bullets: [
      '只保留当前任务、进度、下一步动作',
      '减少白卡片和多层滚动，强化沉浸感'
    ],
    sectionTitle: '总览段落',
    sectionBody: '这里展示这次 mock interview 的主题、阶段、候选能力重点与当前状态，作为宇宙首页的第一屏以下内容。',
    theme: {
      line: 'rgba(205, 227, 255, 0.24)',
      dot: 'rgba(255, 255, 255, 0.82)',
      activeDot: '#76f7ea',
      primary: '#76f7ea',
      secondary: '#e8f7ff',
      planet: 'radial-gradient(circle at 32% 28%, #a8fffd 0%, #48d7cf 22%, #12496d 48%, #091322 76%, #050913 100%)',
      planetGlow: 'rgba(118, 247, 234, 0.34)',
      planetShadow: 'rgba(2, 5, 14, 0.9)',
      atmosphere: 'rgba(132, 255, 246, 0.55)',
      ring: 'rgba(118, 247, 234, 0.2)'
    },
    shellBackground: 'linear-gradient(124deg, #091326 0%, #0b1730 34%, #122847 64%, #070c15 100%)',
    glowA: 'radial-gradient(circle at 6% 8%, rgba(88, 239, 226, 0.42) 0%, rgba(88, 239, 226, 0) 38%)',
    glowB: 'radial-gradient(circle at 82% 14%, rgba(120, 166, 255, 0.24) 0%, rgba(120, 166, 255, 0) 32%)',
    nebula: 'linear-gradient(118deg, rgba(17, 33, 57, 0.84) 0%, rgba(7, 11, 23, 0.28) 42%, rgba(2, 4, 9, 0.72) 100%)',
    planetSize: '36vw',
    planetRight: '-7vw',
    planetBottom: '-11vh'
  },
  {
    id: 'library',
    navLabel: '资料库',
    eyebrow: 'Source intake',
    title: '资料库',
    summary: '资料入口先保留在这条宇宙轨道里，用更轻的方式承接当前训练所依赖的文档来源。',
    bullets: [
      '集中承接当前训练主题下的核心资料',
      '导入、查看、确认来源都在这条链路里完成'
    ],
    sectionTitle: '资料承接区',
    sectionBody: '这里承接当前训练所依赖的资料来源、导入入口和最近使用文档，不再把资料动作甩到旧页面。',
    theme: {
      line: 'rgba(224, 225, 255, 0.24)',
      dot: 'rgba(255, 255, 255, 0.84)',
      activeDot: '#c6ceff',
      primary: '#c6ceff',
      secondary: '#f3f0ff',
      planet: 'radial-gradient(circle at 40% 30%, #f1f1ff 0%, #b6bbdc 22%, #6a5b96 48%, #241835 74%, #09070d 100%)',
      planetGlow: 'rgba(183, 190, 255, 0.32)',
      planetShadow: 'rgba(5, 4, 12, 0.9)',
      atmosphere: 'rgba(205, 212, 255, 0.5)',
      ring: 'rgba(194, 203, 255, 0.18)'
    },
    shellBackground: 'linear-gradient(126deg, #00383c 0%, #00545b 38%, #006368 70%, #022d34 100%)',
    glowA: 'radial-gradient(circle at 8% 8%, rgba(0, 145, 151, 0.38) 0%, rgba(0, 145, 151, 0.16) 17%, rgba(0, 145, 151, 0) 36%)',
    glowB: 'radial-gradient(circle at 84% 62%, rgba(24, 103, 116, 0.24) 0%, rgba(24, 103, 116, 0.08) 18%, rgba(24, 103, 116, 0) 42%)',
    nebula: 'radial-gradient(circle at 10% 10%, rgba(0, 128, 134, 0.18) 0%, rgba(0, 128, 134, 0.07) 18%, rgba(0, 128, 134, 0) 36%), linear-gradient(118deg, rgba(0, 58, 64, 0.72) 0%, rgba(0, 84, 88, 0.48) 45%, rgba(3, 55, 65, 0.42) 100%)',
    planetSize: '33vw',
    planetRight: '-5vw',
    planetBottom: '-7vh'
  },
  {
    id: 'mock',
    navLabel: '模拟面试',
    eyebrow: 'Live exchange',
    title: '模拟面试',
    summary: '主问题、追问、回答输入和提示应该被收拢成一个强主任务区，而不是很多独立卡片。',
    bullets: [
      '问题区域成为页面主轴',
      '输入与反馈关系更直接'
    ],
    sectionTitle: '模拟面试段落',
    sectionBody: '这里会放大问题与回答流，保留最核心的对话体验，减少侧边信息对注意力的干扰。',
    theme: {
      line: 'rgba(255, 230, 230, 0.22)',
      dot: 'rgba(255, 255, 255, 0.88)',
      activeDot: '#ffffff',
      primary: '#ffffff',
      secondary: '#ffe9dc',
      planet: 'radial-gradient(circle at 32% 26%, #f3c890 0%, #a96b3d 21%, #59341f 44%, #20130f 66%, #090606 100%)',
      planetGlow: 'rgba(255, 159, 70, 0.3)',
      planetShadow: 'rgba(12, 4, 0, 0.86)',
      atmosphere: 'rgba(255, 197, 120, 0.28)',
      ring: 'rgba(255, 255, 255, 0.16)'
    },
    shellBackground: 'linear-gradient(126deg, #170f3b 0%, #2c1f72 40%, #352d87 69%, #120f2d 100%)',
    glowA: 'radial-gradient(circle at 2% 8%, rgba(124, 249, 219, 0.4) 0%, rgba(124, 249, 219, 0) 34%)',
    glowB: 'radial-gradient(circle at 80% 12%, rgba(180, 108, 255, 0.18) 0%, rgba(180, 108, 255, 0) 30%)',
    nebula: 'linear-gradient(114deg, rgba(43, 29, 103, 0.5) 0%, rgba(35, 26, 85, 0.44) 38%, rgba(7, 8, 17, 0.72) 100%)',
    planetSize: '40vw',
    planetRight: '-10vw',
    planetBottom: '-18vh'
  },
  {
    id: 'feedback',
    navLabel: '专项刷题',
    eyebrow: 'Focused drills',
    title: '专项刷题',
    summary: '专项刷题承接弱项收敛，不再作为旁支小入口，而是主训练链路中的定向强化阶段。',
    bullets: [
      '围绕薄弱点收敛题目范围',
      '用更短的链路完成定向补练'
    ],
    sectionTitle: '专项刷题区',
    sectionBody: '这里承接当前弱项标签下的训练队列、题量和难度，不再和总览首屏同时争抢注意力。',
    theme: {
      line: 'rgba(212, 247, 255, 0.25)',
      dot: 'rgba(255, 255, 255, 0.82)',
      activeDot: '#baf5ff',
      primary: '#baf5ff',
      secondary: '#e7fbff',
      planet: 'radial-gradient(circle at 38% 28%, #f6ffff 0%, #79cdf6 18%, #15567f 42%, #0b223b 66%, #050911 100%)',
      planetGlow: 'rgba(100, 208, 255, 0.3)',
      planetShadow: 'rgba(1, 6, 15, 0.9)',
      atmosphere: 'rgba(164, 233, 255, 0.56)',
      ring: 'rgba(140, 227, 255, 0.17)'
    },
    shellBackground: 'linear-gradient(126deg, #04121c 0%, #0a2331 38%, #13445c 70%, #092030 100%)',
    glowA: 'radial-gradient(circle at 14% 10%, rgba(100, 224, 255, 0.44) 0%, rgba(100, 224, 255, 0) 33%)',
    glowB: 'radial-gradient(circle at 82% 18%, rgba(111, 255, 220, 0.16) 0%, rgba(111, 255, 220, 0) 28%)',
    nebula: 'linear-gradient(120deg, rgba(7, 24, 39, 0.54) 0%, rgba(16, 54, 76, 0.35) 42%, rgba(4, 10, 17, 0.72) 100%)',
    planetSize: '38vw',
    planetRight: '-8vw',
    planetBottom: '-14vh'
  },
  {
    id: 'report',
    navLabel: '复盘报告 / 训练历史',
    eyebrow: 'Mission archive',
    title: '复盘报告 / 训练历史',
    summary: '复盘报告与训练历史先合并承接，统一展示最近结果、历史 session 和下一轮训练依据。',
    bullets: [
      '强调最近结果与薄弱点总结',
      '从历史记录里回看之前的训练轨迹'
    ],
    sectionTitle: '复盘报告与训练历史',
    sectionBody: '这里承接最近一轮训练完成后的摘要、弱项标签与历史记录，用一个节点统一收束而不增加轨道复杂度。',
    theme: {
      line: 'rgba(221, 222, 255, 0.22)',
      dot: 'rgba(255, 255, 255, 0.82)',
      activeDot: '#7ff8dc',
      primary: '#7ff8dc',
      secondary: '#f0ecff',
      planet: 'radial-gradient(circle at 38% 30%, #d2c8ff 0%, #8672ff 22%, #3c2f8f 50%, #1b1843 72%, #080814 100%)',
      planetGlow: 'rgba(126, 113, 255, 0.34)',
      planetShadow: 'rgba(3, 3, 12, 0.9)',
      atmosphere: 'rgba(168, 158, 255, 0.54)',
      ring: 'rgba(152, 140, 255, 0.18)'
    },
    shellBackground: 'linear-gradient(126deg, #120d24 0%, #261545 42%, #42254e 72%, #09070c 100%)',
    glowA: 'radial-gradient(circle at 4% 6%, rgba(103, 121, 255, 0.42) 0%, rgba(103, 121, 255, 0) 34%)',
    glowB: 'radial-gradient(circle at 78% 18%, rgba(255, 205, 142, 0.18) 0%, rgba(255, 205, 142, 0) 28%)',
    nebula: 'linear-gradient(112deg, rgba(42, 24, 70, 0.86) 0%, rgba(61, 19, 65, 0.44) 42%, rgba(7, 6, 10, 0.72) 100%)',
    planetSize: '34vw',
    planetRight: '-5vw',
    planetBottom: '-8vh'
  }
]
