export const students = [
  {id:'zhang', name:'张三', grade:'五年级', textbook:'人教版', className:'晚托A班', color:'#dcefe8'},
  {id:'li', name:'李四', grade:'五年级', textbook:'人教版', className:'晚托A班', color:'#ffe4d5'},
  {id:'wang', name:'王五', grade:'五年级', textbook:'人教版', className:'晚托A班', color:'#e7e2fa'},
  {id:'zhao', name:'赵六', grade:'五年级', textbook:'人教版', className:'晚托A班', color:'#fff0c9'},
  {id:'xiao-m', name:'小明', grade:'五年级', textbook:'人教版', className:'晚托A班', color:'#d9eafb'},
  {id:'xiao-h', name:'小红', grade:'五年级', textbook:'人教版', className:'晚托A班', color:'#f7dce4'},
  {id:'chen', name:'陈思', grade:'四年级', textbook:'人教版', className:'晚托A班', color:'#e7f0ca'},
  {id:'yang', name:'杨洋', grade:'四年级', textbook:'人教版', className:'晚托A班', color:'#e5edf8'},
  {id:'zhou', name:'周宁', grade:'四年级', textbook:'人教版', className:'晚托A班', color:'#f4e2cf'},
  {id:'wu', name:'吴越', grade:'四年级', textbook:'人教版', className:'晚托A班', color:'#dce7f2'},
  {id:'lin', name:'林一', grade:'四年级', textbook:'人教版', className:'晚托A班', color:'#eadff1'},
  {id:'he', name:'何苗', grade:'四年级', textbook:'人教版', className:'晚托A班', color:'#d8ece8'},
];

export const subjects = ['语文','数学','英语','科学'];
export const metricLabels = {accuracy:'准确度', speed:'速度', handwriting:'字迹', attitude:'学习态度', discipline:'纪律'};
export const grades = ['A','B','C','D'];
export const weeklyLabels = ['学习之星','习惯之星','优秀学员','关注学员'];

export const studentEvidence = {
  zhang: {
    score: 86,
    issues:[
      {title:'应用题审题不清', count:3, state:'跟进中'},
      {title:'单位换算错误', count:2, state:'已改善'},
    ],
    solution:'加强审题训练，整理常见单位换算表，每天练习5题。',
    result:'后半周错误率下降，订正后能独立完成。',
    history:[
      {date:'5月18日', title:'应用题审题不清', detail:'讲解题意后能够独立列式。', state:'跟进中'},
      {date:'5月14日', title:'单位换算错误', detail:'整理单位换算表，持续练习。', state:'已改善'},
      {date:'5月10日', title:'字迹不够工整', detail:'每日书写打卡，卷面明显整洁。', state:'已改善'},
    ]
  },
  li:{score:92,issues:[{title:'阅读题答题不完整',count:2,state:'跟进中'}],solution:'练习完整表达，回答时标出关键词。',result:'能够主动补充答案。',history:[]},
};

export const stageSubjectDimensions = {
  语文:['字词基础','句子运用','阅读理解','习作表达'],
  数学:['基础计算','概念掌握','解决问题'],
  英语:['词汇','句型语法','阅读理解'],
  科学:['基础知识','实验探究','知识应用'],
};

export const stageSeed = {
  midterm:{
    scores:{语文:85,数学:86,英语:80,科学:88},
    ratings:{
      语文:{字词基础:'A',句子运用:'B',阅读理解:'B',习作表达:'B'},
      数学:{基础计算:'A',概念掌握:'B',解决问题:'B'},
      英语:{词汇:'B',句型语法:'B',阅读理解:'B'},
      科学:{基础知识:'A',实验探究:'B',知识应用:'B'},
    },
    weakness:{语文:'阅读表达完整性',数学:'应用题理解、单位换算',英语:'词汇拼写',科学:'知识应用'},
  },
  semester:{
    scores:{语文:88,数学:90,英语:84,科学:91},
    ratings:{
      语文:{字词基础:'A',句子运用:'A',阅读理解:'B',习作表达:'B'},
      数学:{基础计算:'A',概念掌握:'A',解决问题:'B'},
      英语:{词汇:'B',句型语法:'B',阅读理解:'A'},
      科学:{基础知识:'A',实验探究:'A',知识应用:'A'},
    },
    weakness:{语文:'习作表达',数学:'复杂应用题',英语:'时态运用',科学:'实验结论表达'},
  },
};

export const scoreSeed = {
  zhang:[
    {id:'s1',type:'周测',name:'数学周测1',date:'2025-03-10',subject:'数学',fullScore:100,score:62,classAverage:68,rank:'18/45',weakness:['应用题理解'],causes:['审题不清'],correction:'已订正'},
    {id:'s2',type:'单元测试',name:'第三单元测试',date:'2025-03-24',subject:'数学',fullScore:100,score:68,classAverage:70,rank:'15/45',weakness:['单位换算'],causes:['计算失误'],correction:'已订正'},
    {id:'s3',type:'月考',name:'三月月考',date:'2025-04-07',subject:'数学',fullScore:100,score:55,classAverage:67,rank:'25/45',weakness:['应用题理解','单位换算'],causes:['审题不清','思路不清晰'],correction:'部分订正'},
    {id:'s4',type:'周测',name:'数学周测2',date:'2025-04-21',subject:'数学',fullScore:100,score:72,classAverage:69,rank:'12/45',weakness:['应用题理解'],causes:['概念不清'],correction:'已订正'},
    {id:'s5',type:'单元测试',name:'第四单元测试',date:'2025-05-06',subject:'数学',fullScore:100,score:78,classAverage:71,rank:'9/45',weakness:['单位换算'],causes:['计算失误'],correction:'已订正'},
    {id:'s6',type:'周测',name:'数学周测3',date:'2025-05-20',subject:'数学',fullScore:100,score:86,classAverage:72,rank:'6/45',weakness:['应用题理解'],causes:['审题不清'],correction:'已订正'},
    {id:'c1',type:'单元测试',name:'语文第三单元',date:'2025-05-12',subject:'语文',fullScore:100,score:84,classAverage:79,rank:'10/45',weakness:['阅读表达'],causes:['答案不完整'],correction:'已订正'},
  ]
};
