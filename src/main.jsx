import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {
  ArrowLeft, Award, BarChart3, CalendarDays, Check, ChevronRight, ClipboardCheck,
  Copy, Download, FilePlus2, FileText, GraduationCap, History, Home, Plus,
  RefreshCw, Save, Search, Sparkles, Star, Trash2, TrendingUp, Upload, UserPlus, UserRound, X
} from 'lucide-react';
import './styles.css';
import './score-styles.css';
import './mvp-styles.css';
import {grades, metricLabels, scoreSeed, stageSeed, stageSubjectDimensions, studentEvidence, students, subjects, weeklyLabels} from './data.js';
import {defaultTemplates, knowledgePoints} from './knowledge.js';

const DEFAULT_METRICS={accuracy:'A',speed:'A',handwriting:'A',attitude:'A',discipline:'A'};
const STORAGE_KEY='banxue-complete-v2';
const ERROR_CAUSES=['概念不清','计算失误','粗心大意','审题不清','思路不清晰','时间不足'];
const WEAKNESS_OPTIONS=['应用题理解','单位换算','阅读表达','词汇拼写','计算方法','基础知识'];

function getScores(store,studentId){return store.scores?.[studentId]?.length?store.scores[studentId]:(scoreSeed[studentId]||[])}
function getWeeklyGrade(score){return score>=90?'A':score>=80?'B':score>=70?'C':'D'}
function getWeeklyGradeLabel(grade){return {A:'优秀',B:'良好',C:'及格',D:'需关注'}[grade]}
function getTodayKey(){return new Date().toLocaleDateString('sv-SE')}
function getTodayLabel(){return new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric'})}
function cleanMetrics(metrics={}){return Object.fromEntries(Object.keys(metricLabels).map(key=>[key,metrics[key]||DEFAULT_METRICS[key]]))}
function getScoreConclusion(records,student){
  if(!records.length)return `${student.name}暂未录入考试成绩。`;
  const ordered=[...records].sort((a,b)=>a.date.localeCompare(b.date));
  const latest=ordered.at(-1);const previous=ordered.at(-2);
  const rate=Math.round(latest.score/latest.fullScore*100);const previousRate=previous?Math.round(previous.score/previous.fullScore*100):rate;
  const direction=rate>=previousRate?`较上次提高${rate-previousRate}个百分点`:`较上次下降${previousRate-rate}个百分点`;
  const weakness=latest.weakness?.[0]||'基础知识';
  const cause=latest.causes?.[0]||'检查习惯';
  return `${latest.name}得分率${rate}%，${direction}，整体表现${rate>=80?'良好':'仍需巩固'}。目前主要薄弱点是${weakness}，失分原因以${cause}为主，建议继续专项练习并做好错题复盘。`;
}

function useSavedState(){
  const [state,setState]=useState(()=>{
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||{students,daily:{},weekly:{},stage:{},scores:{},history:{},templates:defaultTemplates}}
    catch{return {students,daily:{},weekly:{},stage:{},scores:{},history:{},templates:defaultTemplates}}
  });
  useEffect(()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(state)),[state]);
  return [state,setState];
}

function Toast({message}){return message?<div className="toast"><Check size={16}/>{message}</div>:null}

function StudentRail({selectedId,onSelect,studentList,records={}}){
  return <div className="student-rail" aria-label="选择学员">
    {studentList.map(student=><button key={student.id} className={selectedId===student.id?'student active':'student'} onClick={()=>onSelect(student.id)}>
      <span className="avatar" style={{background:student.color}}>{student.name[0]}</span>
      <span>{student.name}</span>
      {records[student.id]?<i><Check size={9}/></i>:null}
    </button>)}
  </div>
}

function GradeControl({label,value,onChange}){
  return <div className="grade-control"><span>{label}</span><div>{grades.map(grade=><button key={grade} className={value===grade?'selected':''} onClick={()=>onChange(grade)}>{grade}</button>)}</div></div>
}

function StageDimensionControl({label,value,onChange}){
  return <div className="stage-dimension"><span>{label}</span><div>{grades.map(grade=><button key={grade} className={value===grade?'selected':''} onClick={()=>onChange(grade)}>{grade}</button>)}</div></div>
}

async function copyText(text,notify){
  if(!text){notify('请先生成反馈');return}
  try{await navigator.clipboard.writeText(text);notify('反馈已复制，可粘贴发送')}
  catch{notify('复制失败，请长按文字复制')}
}

function DailyPage({selectedId,setSelectedId,studentList,store,setStore,notify}){
  const [activeSubject,setActiveSubject]=useState('数学');
  const [query,setQuery]=useState('');
  const [customIssue,setCustomIssue]=useState('');
  const student=studentList.find(item=>item.id===selectedId)||studentList[0];
  const todayKey=getTodayKey();
  const savedRecord=store.daily?.[selectedId]||{};
  const isToday=savedRecord.recordDate===todayKey;
  const inheritedMetrics=cleanMetrics(store.lastMetrics?.[selectedId]||savedRecord.metrics||DEFAULT_METRICS);
  const rawRecord=isToday?savedRecord:{};
  const record={recordDate:todayKey,metrics:inheritedMetrics,status:[],followUp:'',feedback:'',length:'简短',tone:'自然',subjects:{},...rawRecord,metrics:cleanMetrics(rawRecord.metrics||inheritedMetrics)};
  const subjectRecord=record.subjects[activeSubject]||{mode:'normal',fact:'',knowledgeId:'',issues:[],positives:[],note:''};
  const selectedKnowledge=knowledgePoints.find(item=>item.id===subjectRecord.knowledgeId);
  const filteredKnowledge=knowledgePoints.filter(item=>item.subject===activeSubject&&item.grade===student.grade&&(!query||`${item.name}${item.unit}${item.lesson}${item.keywords.join('')}`.includes(query))).slice(0,5);
  const recentKnowledge=(store.recentKnowledge||[]).map(id=>knowledgePoints.find(item=>item.id===id)).filter(item=>item&&item.subject===activeSubject&&item.grade===student.grade).slice(0,4);
  const setRecord=next=>setStore(current=>({...current,daily:{...(current.daily||{}),[selectedId]:{...record,recordDate:todayKey,...next}}}));
  const setSubjectRecord=next=>setRecord({subjects:{...record.subjects,[activeSubject]:{...subjectRecord,mode:'problem',...next}}});
  const chooseKnowledge=point=>{setStore(current=>({...current,recentKnowledge:[point.id,...(current.recentKnowledge||[]).filter(id=>id!==point.id)].slice(0,8),daily:{...(current.daily||{}),[selectedId]:{...record,recordDate:todayKey,subjects:{...record.subjects,[activeSubject]:{...subjectRecord,mode:'problem',knowledgeId:point.id,issues:[]}}}}}));setQuery('')};
  const toggleList=(key,value)=>setSubjectRecord({[key]:subjectRecord[key].includes(value)?subjectRecord[key].filter(item=>item!==value):[...subjectRecord[key],value]});
  const toggleStatus=status=>setRecord({status:record.status.includes(status)?record.status.filter(item=>item!==status):[...record.status,status]});
  const clearSubject=()=>{const nextSubjects={...record.subjects};delete nextSubjects[activeSubject];setRecord({subjects:nextSubjects});setQuery('');setCustomIssue('');notify(`${activeSubject}问题记录已清除`)};
  const generate=(alternate=false)=>{
    const details=[];const positives=[];
    subjects.forEach(subject=>{const item=record.subjects[subject];if(!item)return;if(item.positives?.length)positives.push(...item.positives);if(item.knowledgeId||item.issues?.length||item.note){const kp=knowledgePoints.find(point=>point.id===item.knowledgeId);details.push(`${subject}${kp?`“${kp.name}”`:''}${item.issues?.length?`出现${item.issues.slice(0,2).join('、')}`:''}${item.note?`，${item.note}`:''}`)}});
    const lead=alternate?`今天${student.name}整体学习状态较稳定。`:`今天${student.name}作业完成${record.metrics.speed==='A'?'较快':record.metrics.speed==='C'||record.metrics.speed==='D'?'偏慢':'正常'}，学习态度${record.metrics.attitude==='A'?'积极':'认真'}。`;
    const detailText=details.length?`${details.slice(0,record.length==='简短'?1:3).join('；')}。`:'各科作业均按要求完成，暂未发现明显问题。';
    const goodText=positives.length?`本日表现较好的是${[...new Set(positives)].slice(0,2).join('、')}。`:'';
    const resultText=record.status.includes('已订正')||record.status.includes('二次完成')?'相关问题已完成订正。':record.status.includes('仍需跟进')?'仍需在下次作业中继续跟进。':'';
    const limits={简短:80,标准:150,详细:250};
    setRecord({feedback:`${lead}${detailText}${goodText}${resultText}`.slice(0,limits[record.length])});notify(alternate?'已换一种说法':'今日反馈已生成');
  };
  const saveDaily=()=>{if(!record.feedback){notify('请先生成或填写今日反馈');return}const entry={id:`daily-${Date.now()}`,date:todayKey,type:'daily',title:'今日反馈',text:record.feedback};setStore(current=>({...current,lastMetrics:{...(current.lastMetrics||{}),[selectedId]:cleanMetrics(record.metrics)},daily:{...(current.daily||{}),[selectedId]:{...record,recordDate:todayKey,confirmedFeedback:record.feedback,savedAt:Date.now()}},history:{...(current.history||{}),[selectedId]:[entry,...(current.history?.[selectedId]||[])]}}));notify('今日反馈已确认保存，明天将沿用本次表现评价')};
  const todayRecords=Object.fromEntries(Object.entries(store.daily||{}).filter(([,item])=>item.recordDate===todayKey));
  return <>
    <PageHeader title="今日记录" subtitle={`晚托A班 · ${getTodayLabel()}`}/>
    <StudentRail selectedId={selectedId} onSelect={setSelectedId} studentList={studentList} records={todayRecords}/>
    <main className="page-content">
      <section className="intro-row"><div><span className="section-kicker">正在记录</span><h2>{student.name}<small>{student.grade} · {student.textbook}</small></h2></div><span className="progress-copy">今日 {Object.keys(todayRecords).filter(id=>studentList.some(item=>item.id===id)).length}/{studentList.length}</span></section>
      <section className="surface compact">
        <div className="surface-title"><h3>表现评价</h3><small>{isToday?'今日已记录':store.lastMetrics?.[selectedId]||savedRecord.metrics?'已沿用该生上次评价':'首次默认全部 A'}</small></div>
        <div className="grade-list">{Object.entries(metricLabels).map(([key,label])=><GradeControl key={key} label={label} value={record.metrics[key]} onChange={value=>setRecord({metrics:{...record.metrics,[key]:value}})}/>)}</div>
      </section>
      <section className="surface subject-work">
        <div className="surface-title"><h3>有问题的学科</h3><small>未记录的科目即无问题</small></div>
        <div className="subject-tabs">{subjects.map(subject=>{const item=record.subjects[subject];const hasIssue=Boolean(item&&(item.knowledgeId||item.issues?.length||item.note));return <button key={subject} className={activeSubject===subject?'active':''} onClick={()=>{setActiveSubject(subject);setQuery('')}}>{subject}{hasIssue?<i/>:null}</button>})}</div>
        <div className="subject-details always-open">
          {recentKnowledge.length?<div className="recent-knowledge"><span>最近使用</span>{recentKnowledge.map(point=><button key={point.id} onClick={()=>chooseKnowledge(point)}>{point.name}</button>)}</div>:null}
          <label className="knowledge-search"><Search size={15}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="搜索知识点，如：小数除法、病句"/>{query?<button onClick={()=>setQuery('')}><X size={13}/></button>:null}</label>
          {query||!selectedKnowledge?<div className="knowledge-list">{filteredKnowledge.map(point=><button key={point.id} onClick={()=>chooseKnowledge(point)}><strong>{point.name}</strong><small>{point.grade} · {point.semester} · {point.unit}</small></button>)}{!filteredKnowledge.length?<p>没有找到，可直接使用自定义问题。</p>:null}</div>:null}
          {selectedKnowledge?<div className="selected-point"><span>已选知识点</span><strong>{selectedKnowledge.name}</strong><button onClick={()=>setSubjectRecord({knowledgeId:'',issues:[]})}>更换</button></div>:null}
          <div className="detail-label">常见问题 <small>可多选</small></div><div className="tag-select">{(selectedKnowledge?.problems||['理解还不够牢固','作业速度偏慢','需要提醒检查']).map(issue=><button key={issue} className={subjectRecord.issues.includes(issue)?'active attention':''} onClick={()=>toggleList('issues',issue)}>{subjectRecord.issues.includes(issue)?<Check size={13}/>:<Plus size={13}/>} {issue}</button>)}</div>
          <div className="custom-issue"><input value={customIssue} onChange={event=>setCustomIssue(event.target.value)} placeholder="自定义问题"/><button onClick={()=>{if(!customIssue.trim())return;setSubjectRecord({issues:[...subjectRecord.issues,customIssue.trim()]});setCustomIssue('')}}>添加</button></div>
          <label className="full-field">事实补充<input value={subjectRecord.note} onChange={event=>setSubjectRecord({note:event.target.value})} placeholder="如：听写10个错3个，讲解后能独立完成"/></label>
          {record.subjects[activeSubject]?<button className="clear-subject" onClick={clearSubject}>清除本科问题记录</button>:null}
        </div>
      </section>
      <section className="surface compact">
        <div className="surface-title"><h3>处理状态</h3><small>可多选</small></div>
        <div className="choice-row">{['已讲解','已订正','二次完成','仍需跟进'].map(status=><button key={status} className={record.status.includes(status)?'choice selected':''} onClick={()=>toggleStatus(status)}>{record.status.includes(status)?<Check size={14}/>:null}{status}</button>)}</div>
        {record.status.includes('仍需跟进')?<label className="full-field follow-field">下次提醒<input value={record.followUp} onChange={event=>setRecord({followUp:event.target.value})} placeholder="如：明天复查单位换算"/></label>:null}
      </section>
      <section className="surface feedback-preview">
        <div className="surface-title"><h3>今日反馈</h3><span>{record.feedback.length}/{record.length==='简短'?80:record.length==='标准'?150:250}字</span></div>
        <div className="feedback-settings"><div>{['简短','标准','详细'].map(item=><button key={item} className={record.length===item?'active':''} onClick={()=>setRecord({length:item})}>{item}</button>)}</div><select value={record.tone} onChange={event=>setRecord({tone:event.target.value})}>{['自然','温和','客观'].map(item=><option key={item} value={item}>{item}语气</option>)}</select></div>
        <textarea value={record.feedback} onChange={event=>setRecord({feedback:event.target.value.slice(0,record.length==='简短'?80:record.length==='标准'?150:250)})} placeholder="系统根据真实记录生成，老师可直接修改"/>
        <div className="feedback-tools"><button onClick={()=>generate(false)}><Sparkles size={15}/>生成反馈</button><button onClick={()=>generate(true)}><RefreshCw size={15}/>换种说法</button><button onClick={()=>copyText(record.feedback,notify)}><Copy size={15}/>复制</button></div>
        <button className="confirm-save" onClick={saveDaily}><Save size={16}/>确认最终版本并保存</button>
      </section>
    </main>
  </>
}

function WeeklyPage({selectedId,setSelectedId,studentList,store,setStore,notify}){
  const student=studentList.find(item=>item.id===selectedId)||studentList[0];
  const evidence=studentEvidence[selectedId]||studentEvidence.zhang;
  const weeklyGrade=getWeeklyGrade(evidence.score);
  const weekly=store.weekly[selectedId]||{attention:'一般',label:'',customLabel:'',reason:'',public:true,feedback:''};
  const setWeekly=next=>setStore(current=>({...current,weekly:{...(current.weekly||{}),[selectedId]:{...weekly,...next}}}));
  const activeLabel=weekly.label==='自定义'?weekly.customLabel:weekly.label;
  const generateReason=()=>{
    const reason=weekly.label==='关注学员'
      ?`本周应用题审题问题出现${evidence.issues[0].count}次，讲解后能够订正，但独立检查习惯仍需持续跟进。`
      :`本周作业完成认真，能够主动订正，${evidence.issues[1]?.title||'学习状态'}已有明显改善，整体表现稳定。`;
    setWeekly({reason}); notify('已根据本周记录生成理由');
  };
  const generateFeedback=()=>{setWeekly({feedback:`本周学习反馈：${student.name}整体表现稳定。${evidence.issues[0].title}出现${evidence.issues[0].count}次，已通过专项练习和订正进行巩固，${evidence.result}\n下周建议：继续加强审题与检查习惯，每天完成少量针对性练习并及时复盘错题。`});notify('周反馈已生成')};
  const saveWeekly=()=>{if(!weekly.feedback){notify('请先生成或填写周反馈');return}const entry={id:`weekly-${Date.now()}`,date:'第20周',type:'weekly',title:'周反馈',text:weekly.feedback,label:activeLabel,reason:weekly.reason};setStore(current=>({...current,weekly:{...(current.weekly||{}),[selectedId]:{...weekly,savedAt:Date.now()}},history:{...(current.history||{}),[selectedId]:[entry,...(current.history?.[selectedId]||[])]}}));notify('周反馈与标注已保存')};
  return <>
    <PageHeader title="周反馈" subtitle="第20周 · 5月12日—18日" action={<button className="icon-button"><CalendarDays size={18}/></button>}/>
    <StudentRail selectedId={selectedId} onSelect={setSelectedId} studentList={studentList} records={store.weekly}/>
    <main className="page-content">
      <section className="week-score"><div><span>本周综合评分</span><strong>{weeklyGrade}<small>{getWeeklyGradeLabel(weeklyGrade)}</small></strong></div><div className="mini-metrics"><span>准确度<b>84</b></span><span>速度<b>78</b></span><span>字迹<b>82</b></span><span>态度<b>96</b></span></div></section>
      <section className="surface compact">
        <div className="surface-title"><h3>重复问题</h3><small>由每日记录汇总</small></div>
        <div className="issue-list">{evidence.issues.map(issue=><div key={issue.title}><span>{issue.title}<small>{issue.state}</small></span><b>证据 {issue.count} 次</b></div>)}</div>
      </section>
      <section className="surface solution-grid"><div><span>解决措施</span><p>{evidence.solution}</p></div><div><span>效果 / 结果</span><p>{evidence.result}</p></div></section>
      <section className="surface compact">
        <div className="surface-title"><h3>关注程度</h3></div>
        <div className="segment three">{['一般','跟进','重点关注'].map(level=><button key={level} className={weekly.attention===level?'active':''} onClick={()=>setWeekly({attention:level})}>{level}</button>)}</div>
      </section>
      <section className="surface weekly-label">
        <div className="surface-title"><h3>本周标注</h3><small>可不标注，也可标注多名</small></div>
        <div className="label-options">{weeklyLabels.map(label=><button key={label} className={weekly.label===label?'active':''} onClick={()=>setWeekly({label})}><Star size={15}/>{label}</button>)}<button className={weekly.label==='自定义'?'active':''} onClick={()=>setWeekly({label:'自定义'})}><Plus size={15}/>自定义</button></div>
        {weekly.label==='自定义'?<input className="custom-label" value={weekly.customLabel} onChange={event=>setWeekly({customLabel:event.target.value})} placeholder="输入称号，如：进步之星"/>:null}
        <label className="reason-label">标注理由 <span>建议50～80字</span><textarea value={weekly.reason} onChange={event=>setWeekly({reason:event.target.value.slice(0,100)})} placeholder={activeLabel?`写出${activeLabel}的具体事实和理由`:'先选择一个标注'}/></label>
        <div className="privacy-row"><button className={weekly.public?'on':''} onClick={()=>setWeekly({public:!weekly.public})}><i/>{weekly.public?'家长可见':'仅老师可见'}</button><button className="text-btn" onClick={generateReason}><Sparkles size={14}/>生成理由</button></div>
      </section>
      <section className="surface feedback-preview">
        <div className="surface-title"><h3>家长版周反馈</h3><span>{weekly.feedback.length}/160字</span></div>
        <textarea value={weekly.feedback} onChange={event=>setWeekly({feedback:event.target.value.slice(0,160)})} placeholder="汇总本周表现、问题、处理措施和下周重点"/>
        <div className="feedback-tools"><button onClick={generateFeedback}><Sparkles size={15}/>生成周反馈</button><button onClick={()=>copyText(weekly.feedback,notify)}><Copy size={15}/>复制</button><button onClick={()=>setWeekly({feedback:''})}><RefreshCw size={15}/>清空重写</button></div><button className="confirm-save" onClick={saveWeekly}><Save size={16}/>确认周反馈并保存</button>
      </section>
    </main>
  </>
}

function StagePage({selectedId,setSelectedId,studentList,store,setStore,notify}){
  const [type,setType]=useState('midterm');
  const student=studentList.find(item=>item.id===selectedId)||studentList[0];
  const examRecords=getScores(store,selectedId);
  const scoreConclusion=getScoreConclusion(examRecords.filter(record=>record.subject==='数学'),student);
  const seed=stageSeed[type];
  const storedStage=store.stage[`${selectedId}-${type}`]||{};
  const subjectRatings=Object.fromEntries(subjects.map(subject=>[subject,{...(seed.ratings[subject]||{}),...(storedStage.subjectRatings?.[subject]||{})}]));
  const subjectWeaknesses={...seed.weakness,...(storedStage.subjectWeaknesses||{})};
  const stage={evaluation:'',summary:'',plan:'',...storedStage,subjectRatings,subjectWeaknesses};
  const setStage=next=>setStore(current=>({...current,stage:{...(current.stage||{}),[`${selectedId}-${type}`]:{...stage,...next}}}));
  const setSubjectRating=(subject,dimension,value)=>setStage({subjectRatings:{...stage.subjectRatings,[subject]:{...stage.subjectRatings[subject],[dimension]:value}}});
  const setSubjectWeakness=(subject,value)=>setStage({subjectWeaknesses:{...stage.subjectWeaknesses,[subject]:value}});
  const ratingText=subjects.map(subject=>`${subject}：${stageSubjectDimensions[subject].map(dimension=>`${dimension}${stage.subjectRatings[subject]?.[dimension]||'A'}`).join('、')}`).join('\n');
  const weaknessText=subjects.map(subject=>`${subject}：${stage.subjectWeaknesses[subject]||'暂无明显薄弱点'}`).join('\n');
  const generate=()=>{setStage({evaluation:`${student.name}本阶段整体学习状态稳定，各学科表现以A、B等级为主，作业完成和订正情况较好。分科评级与薄弱点已在上方记录，可结合实际继续修改。`,summary:`本阶段已结合日常作业、考试成绩和分科学情进行整理。${subjects.map(subject=>`${subject}重点关注${stage.subjectWeaknesses[subject]||'基础巩固'}`).join('；')}。`,...(type==='midterm'?{plan:'下半学期继续根据各科薄弱点安排针对性练习，并通过订正和复查观察改善情况。'}:{})});notify(type==='midterm'?'期中评价已整理':'学期反馈已整理')};
  const stageText=`学科学情评级：\n${ratingText}\n\n分科薄弱点：\n${weaknessText}\n\n综合评价：${stage.evaluation}\n辅导总结：${stage.summary}${type==='midterm'?`\n下一阶段辅导重点：${stage.plan}`:''}`;
  const saveStage=()=>{if(!stage.evaluation&&!stage.summary){notify('请先生成或填写阶段总结');return}const entry={id:`stage-${Date.now()}`,date:type==='midterm'?'期中':'学期',type:'stage',title:type==='midterm'?'期中评价':'学期反馈',text:stageText};setStore(current=>({...current,stage:{...(current.stage||{}),[`${selectedId}-${type}`]:{...stage,savedAt:Date.now()}},history:{...(current.history||{}),[selectedId]:[entry,...(current.history?.[selectedId]||[])]}}));notify('阶段总结已保存')};
  return <>
    <PageHeader title="阶段总结" subtitle={`${student.name} · ${student.grade}`}/>
    <div className="stage-switch"><button className={type==='midterm'?'active':''} onClick={()=>setType('midterm')}>期中评价</button><button className={type==='semester'?'active':''} onClick={()=>setType('semester')}>学期反馈</button></div>
    <StudentRail selectedId={selectedId} onSelect={setSelectedId} studentList={studentList}/>
    <main className="page-content">
      <section className="surface score-table">
        <div className="surface-title"><h3>学科成绩与趋势</h3><small>基准 → 当前</small></div>
        {subjects.map((subject,index)=><div className="score-row" key={subject}><span>{subject}</span><small>{[78,82,75,80][index]}分</small><i><b style={{width:`${seed.scores[subject]}%`}}/></i><strong>{seed.scores[subject]}分</strong></div>)}
      </section>
      <section className="surface stage-subjects">
        <div className="surface-title"><h3>分科学情评级与薄弱点</h3><small>A优秀 · B良好 · C及格 · D需关注</small></div>
        {subjects.map(subject=><div className="stage-subject" key={subject}>
          <div className="stage-subject-title"><strong>{subject}</strong><span>{stageSubjectDimensions[subject].length}项内容</span></div>
          {stageSubjectDimensions[subject].map(dimension=><StageDimensionControl key={dimension} label={dimension} value={stage.subjectRatings[subject]?.[dimension]||'A'} onChange={value=>setSubjectRating(subject,dimension,value)}/>)}
          <label>本科薄弱点<input value={stage.subjectWeaknesses[subject]||''} onChange={event=>setSubjectWeakness(subject,event.target.value)} placeholder={`填写${subject}需要加强的内容；没有可留空`}/></label>
        </div>)}
      </section>
      <section className="surface stage-score-note"><div className="surface-title"><h3>成绩分析摘要</h3><TrendingUp size={16}/></div><p>{scoreConclusion}</p><button onClick={()=>{setStage({evaluation:[stage.evaluation,scoreConclusion].filter(Boolean).join('\n')});notify('成绩分析已加入综合评价')}}>加入综合评价</button></section>
      <section className="surface stage-text"><label>综合评价<textarea value={stage.evaluation} onChange={event=>setStage({evaluation:event.target.value})} placeholder="学习习惯、态度、纪律及本阶段进步"/></label><label>辅导总结<textarea value={stage.summary} onChange={event=>setStage({summary:event.target.value})} placeholder="结合分科薄弱点，填写发现的问题和采取的措施"/></label>{type==='midterm'?<label>下一阶段辅导重点<textarea value={stage.plan} onChange={event=>setStage({plan:event.target.value})} placeholder="下半学期需要继续跟进的目标和方法"/></label>:null}<div className="feedback-tools"><button onClick={generate}><Sparkles size={15}/>自动整理</button><button onClick={()=>copyText(stageText,notify)}><Copy size={15}/>复制总结</button><button onClick={saveStage}><Save size={15}/>保存总结</button></div></section>
    </main>
  </>
}

function ScorePage({selectedId,setSelectedId,studentList,store,setStore,notify,onBack,initialMode='analysis'}){
  const [mode,setMode]=useState(initialMode);
  const [subjectFilter,setSubjectFilter]=useState('数学');
  const [form,setForm]=useState({type:'周测',name:'',date:'2025-05-20',subject:'数学',fullScore:'100',score:'',classAverage:'',rank:'',weakness:[],causes:[],correction:'未订正'});
  const student=studentList.find(item=>item.id===selectedId)||studentList[0];
  const allRecords=getScores(store,selectedId);
  const filteredRecords=allRecords.filter(record=>subjectFilter==='全部'||record.subject===subjectFilter).sort((a,b)=>a.date.localeCompare(b.date));
  const latest=filteredRecords.at(-1);
  const previous=filteredRecords.at(-2);
  const latestRate=latest?Math.round(latest.score/latest.fullScore*100):0;
  const previousRate=previous?Math.round(previous.score/previous.fullScore*100):latestRate;
  const conclusion=getScoreConclusion(filteredRecords,student);
  const toggleFormList=(key,value)=>setForm(current=>({...current,[key]:current[key].includes(value)?current[key].filter(item=>item!==value):[...current[key],value]}));
  const saveScore=()=>{
    if(!form.name.trim()||!form.score){notify('请先填写考试名称和实际得分');return}
    const record={...form,id:`score-${Date.now()}`,fullScore:Number(form.fullScore),score:Number(form.score),classAverage:form.classAverage?Number(form.classAverage):null};
    setStore(current=>({...current,scores:{...(current.scores||{}),[selectedId]:[...(current.scores?.[selectedId]||scoreSeed[selectedId]||[]),record]}}));
    notify('成绩记录已保存');setSubjectFilter(form.subject);setMode('analysis');
  };
  const addToWeekly=()=>{
    const old=store.weekly?.[selectedId]||{};
    setStore(current=>({...current,weekly:{...(current.weekly||{}),[selectedId]:{...old,feedback:[old.feedback,conclusion].filter(Boolean).join('\n')}}}));
    notify('成绩分析已加入周反馈');
  };
  const addToStage=()=>{
    const key=`${selectedId}-midterm`;const old=store.stage?.[key]||{};
    setStore(current=>({...current,stage:{...(current.stage||{}),[key]:{...old,evaluation:[old.evaluation,conclusion].filter(Boolean).join('\n')}}}));
    notify('成绩分析已加入阶段总结');
  };
  const trendPoints=filteredRecords.slice(-6).map((record,index,array)=>({
    x:24+(array.length===1?0:index*(292/Math.max(1,array.length-1))),
    y:126-Math.round(record.score/record.fullScore*100)*.9,
    rate:Math.round(record.score/record.fullScore*100),label:record.date.slice(5)
  }));
  return <>
    <header className="page-header score-header"><button className="back-button" onClick={onBack} aria-label="返回学生档案"><ArrowLeft size={20}/></button><div><h1>{mode==='entry'?'成绩记录':'成绩分析'}</h1><p>{student.name} · {student.grade}</p></div><button className="text-btn" onClick={()=>setMode(mode==='entry'?'analysis':'entry')}>{mode==='entry'?'查看分析':'录入成绩'}</button></header>
    <StudentRail selectedId={selectedId} onSelect={setSelectedId} studentList={studentList} records={store.scores||{}}/>
    {mode==='entry'?<main className="page-content score-entry">
      <section className="surface score-form">
        <div className="form-grid two equal"><label>考试类型<select value={form.type} onChange={event=>setForm({...form,type:event.target.value})}>{['周测','单元测试','月考','期中','期末','其他'].map(item=><option key={item}>{item}</option>)}</select></label><label>考试日期<input type="date" value={form.date} onChange={event=>setForm({...form,date:event.target.value})}/></label></div>
        <label className="full-field">考试名称<input value={form.name} onChange={event=>setForm({...form,name:event.target.value})} placeholder="如：数学第五单元测试"/></label>
        <div className="form-grid three"><label>科目<select value={form.subject} onChange={event=>setForm({...form,subject:event.target.value})}>{subjects.map(item=><option key={item}>{item}</option>)}</select></label><label>满分<input inputMode="numeric" value={form.fullScore} onChange={event=>setForm({...form,fullScore:event.target.value})}/></label><label>实际得分<input inputMode="decimal" value={form.score} onChange={event=>setForm({...form,score:event.target.value})} placeholder="必填"/></label></div>
        <div className="form-grid two equal"><label>班级平均分（选填）<input inputMode="decimal" value={form.classAverage} onChange={event=>setForm({...form,classAverage:event.target.value})} placeholder="如：72"/></label><label>班级排名（选填）<input value={form.rank} onChange={event=>setForm({...form,rank:event.target.value})} placeholder="如：6/45"/></label></div>
      </section>
      <section className="surface compact"><div className="surface-title"><h3>失分知识点</h3><small>可多选</small></div><div className="tag-select">{WEAKNESS_OPTIONS.map(item=><button key={item} className={form.weakness.includes(item)?'active':''} onClick={()=>toggleFormList('weakness',item)}>{form.weakness.includes(item)?<Check size={13}/>:<Plus size={13}/>} {item}</button>)}</div></section>
      <section className="surface compact"><div className="surface-title"><h3>错误原因</h3><small>可多选</small></div><div className="tag-select">{ERROR_CAUSES.map(item=><button key={item} className={form.causes.includes(item)?'active attention':''} onClick={()=>toggleFormList('causes',item)}>{form.causes.includes(item)?<Check size={13}/>:<Plus size={13}/>} {item}</button>)}</div></section>
      <section className="surface compact"><div className="surface-title"><h3>订正情况</h3></div><div className="segment three">{['未订正','已订正','部分订正'].map(item=><button key={item} className={form.correction===item?'active':''} onClick={()=>setForm({...form,correction:item})}>{item}</button>)}</div></section>
      <button className="save-score" onClick={saveScore}><Save size={17}/>保存成绩记录</button>
    </main>:<main className="page-content score-analysis">
      <div className="subject-filter">{['全部',...subjects].map(item=><button key={item} className={subjectFilter===item?'active':''} onClick={()=>setSubjectFilter(item)}>{item}</button>)}</div>
      <section className="surface trend-card"><div className="surface-title"><h3>得分率趋势</h3><small>按不同满分标准化</small></div>{trendPoints.length?<svg viewBox="0 0 340 155" role="img" aria-label="最近考试得分率趋势图"><line x1="24" y1="36" x2="316" y2="36"/><line x1="24" y1="81" x2="316" y2="81"/><line x1="24" y1="126" x2="316" y2="126"/><polyline points={trendPoints.map(point=>`${point.x},${point.y}`).join(' ')} />{trendPoints.map(point=><g key={`${point.x}-${point.label}`}><circle cx={point.x} cy={point.y} r="4"/><text x={point.x} y={point.y-9} textAnchor="middle">{point.rate}%</text><text className="date" x={point.x} y="147" textAnchor="middle">{point.label}</text></g>)}</svg>:<div className="empty-analysis">该科目暂无成绩记录</div>}
        {latest?<div className="score-summary"><span>本次得分率<strong>{latestRate}%</strong><small>{latest.score}/{latest.fullScore}</small></span><span>较上次变化<strong className={latestRate>=previousRate?'up':'down'}>{latestRate>=previousRate?'↑':'↓'} {Math.abs(latestRate-previousRate)}%</strong><small>{latestRate>=previousRate?'提高':'下降'}</small></span><span>班级平均<strong>{latest.classAverage??'—'}</strong><small>{latest.classAverage?'分':'未录入'}</small></span></div>:null}
      </section>
      <section className="analysis-pair"><div className="surface compact"><div className="surface-title"><h3>高频薄弱点</h3></div>{['应用题理解','单位换算','计算方法'].map((item,index)=><div className="weak-bar" key={item}><span>{item}</span><i><b style={{width:`${88-index*20}%`}}/></i><small>{4-index}次</small></div>)}</div><div className="surface compact"><div className="surface-title"><h3>错误原因</h3></div>{['审题不清','计算失误','概念不清'].map((item,index)=><div className="cause-row" key={item}><i style={{background:['#ff6337','#e9a62f','#22a99a'][index]}}/><span>{item}</span><b>{[39,28,17][index]}%</b></div>)}</div></section>
      <section className="surface conclusion"><div className="surface-title"><h3>分析结论</h3><Sparkles size={16}/></div><p>{conclusion}</p></section>
      <section className="surface compact exam-history"><div className="surface-title"><h3>考试记录</h3><small>共{filteredRecords.length}次</small></div>{[...filteredRecords].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8).map(item=><div key={item.id}><time>{item.date.slice(5)}</time><span><strong>{item.name}</strong><small>{item.type} · {item.correction}</small></span><b>{item.score}/{item.fullScore}</b></div>)}{!filteredRecords.length?<p>该科目还没有录入成绩。</p>:null}</section>
      <section className="score-actions"><button onClick={addToWeekly}>加入周反馈</button><button onClick={addToStage}>加入阶段总结</button></section>
    </main>}
  </>
}

function StudentPage({selectedId,setSelectedId,studentList,store,setStore,notify,onOpenScores}){
  const [editing,setEditing]=useState(false);
  const backupInput=useRef(null);
  const student=studentList.find(item=>item.id===selectedId)||studentList[0];
  const evidence=studentEvidence[selectedId]||studentEvidence.zhang;
  const scoreRecords=getScores(store,selectedId);
  const latestScore=[...scoreRecords].sort((a,b)=>a.date.localeCompare(b.date)).at(-1);
  const latestScoreRate=latestScore?Math.round(latestScore.score/latestScore.fullScore*100):null;
  const labels=Object.entries(store.weekly||{}).filter(([id,value])=>id===selectedId&&value.label).map(([,value])=>value.label==='自定义'?value.customLabel:value.label);
  const timeline=evidence.history.length?evidence.history:studentEvidence.zhang.history;
  const savedHistory=store.history?.[selectedId]||[];
  const issueCounts={};Object.values(store.daily?.[selectedId]?.subjects||{}).forEach(item=>(item.issues||[]).forEach(issue=>{issueCounts[issue]=(issueCounts[issue]||0)+1}));
  const frequentIssues=Object.entries(issueCounts).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const updateProfile=next=>setStore(current=>({...current,profiles:{...(current.profiles||{}),[selectedId]:{...(current.profiles?.[selectedId]||{}),...next}}}));
  const exportBackup=()=>{const blob=new Blob([JSON.stringify({version:3,exportedAt:new Date().toISOString(),data:{...store,students:studentList}},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`伴学记录数据备份-${new Date().toISOString().slice(0,10)}.json`;link.click();URL.revokeObjectURL(url);notify('完整数据备份已导出')};
  const importBackup=async event=>{const file=event.target.files?.[0];event.target.value='';if(!file)return;if(!window.confirm('恢复备份会替换当前设备中的全部记录，是否继续？'))return;try{const parsed=JSON.parse(await file.text());const restored=parsed.data||parsed;const restoredStudents=restored.students?.length?restored.students:students;setStore({students:restoredStudents,daily:{},weekly:{},stage:{},scores:{},history:{},templates:defaultTemplates,...restored});setSelectedId(restoredStudents[0].id);setEditing(false);notify(`备份恢复成功，共${restoredStudents.length}名学员`)}catch{notify('备份文件无法识别，请重新选择')}};
  const addStudent=()=>{const colors=['#dcefe8','#ffe4d5','#e7e2fa','#fff0c9','#d9eafb','#f7dce4'];const newStudent={id:`student-${Date.now()}`,name:`新学员${studentList.length+1}`,grade:'五年级',textbook:'人教版',className:'晚托A班',color:colors[studentList.length%colors.length]};setStore(current=>({...current,students:[...studentList,newStudent]}));setSelectedId(newStudent.id);setEditing(true);notify('已新增学员，请修改姓名和档案')};
  const deleteStudent=()=>{if(studentList.length<=1){notify('至少保留一名学员');return}if(!window.confirm(`确认删除${student.name}及其全部记录吗？建议先导出备份。`))return;const remaining=studentList.filter(item=>item.id!==selectedId);setStore(current=>{const next={...current,students:remaining};['profiles','daily','weekly','scores','history'].forEach(key=>{const values={...(current[key]||{})};delete values[selectedId];next[key]=values});const stageValues={...(current.stage||{})};Object.keys(stageValues).filter(key=>key.startsWith(`${selectedId}-`)).forEach(key=>delete stageValues[key]);next.stage=stageValues;return next});setSelectedId(remaining[0].id);setEditing(false);notify('学员及相关记录已删除')};
  return <>
    <PageHeader title="学生档案" subtitle={`${studentList.length}名学员 · 长期记录与跟进`} action={<button className="text-btn" onClick={addStudent}><UserPlus size={15}/>新增学员</button>}/>
    <StudentRail selectedId={selectedId} onSelect={setSelectedId} studentList={studentList}/>
    <main className="page-content">
      <section className="profile"><span className="profile-avatar" style={{background:student.color}}>{student.name[0]}</span><div><h2>{student.name}</h2><p>{student.grade} · {student.textbook} · {student.className}</p></div><button onClick={()=>setEditing(value=>!value)}>{editing?'完成':'编辑'}</button></section>
      {editing?<section className="surface profile-editor"><label className="full-field">学生姓名<input value={student.name} onChange={event=>updateProfile({name:event.target.value})} placeholder="请输入学生姓名"/></label><div className="form-grid two equal"><label>年级<select value={student.grade} onChange={event=>updateProfile({grade:event.target.value})}><option>四年级</option><option>五年级</option><option>六年级</option></select></label><label>教材版本<select value={student.textbook} onChange={event=>updateProfile({textbook:event.target.value})}><option>人教版</option><option>北师大版</option><option>苏教版</option></select></label></div><label className="full-field">班级<input value={student.className} onChange={event=>updateProfile({className:event.target.value})}/></label><button className="delete-student" onClick={deleteStudent}><Trash2 size={15}/>删除这名学员及记录</button></section>:null}
      <section className="surface compact backup-card"><div><strong>数据备份与恢复</strong><small>换手机或清理浏览器前请先导出</small></div><div><button onClick={exportBackup}><Download size={15}/>导出备份</button><button onClick={()=>backupInput.current?.click()}><Upload size={15}/>恢复备份</button><input ref={backupInput} type="file" accept="application/json,.json" onChange={importBackup}/></div></section>
      <section className="score-entry-card"><div><span><BarChart3 size={18}/></span><section><strong>成绩记录与分析</strong><small>{scoreRecords.length?`${scoreRecords.length}次考试 · 最近得分率${latestScoreRate}%`:'暂未录入考试成绩'}</small></section></div><div><button onClick={()=>onOpenScores('entry')}><FilePlus2 size={15}/>录入成绩</button><button onClick={()=>onOpenScores('analysis')}><TrendingUp size={15}/>查看分析</button></div></section>
      <section className="surface compact"><div className="surface-title"><h3>最近周标注</h3></div><div className="recent-labels">{labels.length?labels.map(label=><span key={label}><Award size={14}/>{label}</span>):<><span><Award size={14}/>第20周 优秀学员</span><span><Star size={14}/>第19周 习惯之星</span></>}</div></section>
      <section className="attention-card"><div><span>未解决提醒</span><strong>应用题构思完整性</strong><small>本周仍出现2次，建议下次作业继续检查</small></div><ChevronRight size={20}/></section>
      <section className="surface compact"><div className="surface-title"><h3>高频知识点与问题</h3><small>来自原始记录</small></div><div className="frequency-list">{frequentIssues.length?frequentIssues.map(([issue,count])=><div key={issue}><span>{issue}</span><b>{count}次</b></div>):<><div><span>应用题审题不清</span><b>3次</b></div><div><span>单位换算错误</span><b>2次</b></div></>}</div></section>
      <section className="surface compact"><div className="surface-title"><h3>问题跟进记录</h3><History size={17}/></div><div className="timeline">{timeline.map(item=><div key={`${item.date}-${item.title}`}><i className={item.state==='已改善'?'done':''}/><time>{item.date}</time><section><strong>{item.title}</strong><p>{item.detail}</p></section><em>{item.state}</em></div>)}</div></section>
      <section className="surface compact history-list"><div className="surface-title"><h3>历史反馈</h3><small>保存老师最终确认版本</small></div>{savedHistory.length?savedHistory.map(item=><button key={item.id} onClick={()=>copyText(item.text,notify)}><FileText size={17}/><span>{item.date} · {item.title}<small>{item.text.slice(0,32)}…</small></span><Copy size={15}/></button>):['第20周 周反馈','5月18日 今日反馈','期中评价'].map((item,index)=><button key={item}><FileText size={17}/><span>{item}<small>{index===0?`综合评分${getWeeklyGrade(evidence.score)} · 优秀学员`:index===1?'数学应用题需跟进':'已完成并保存'}</small></span><ChevronRight size={17}/></button>)}</section>
    </main>
  </>
}

function PageHeader({title,subtitle,action}){return <header className="page-header"><div><h1>{title}</h1><p>{subtitle}</p></div>{action}</header>}

const navItems=[
  {id:'daily',label:'今日',icon:Home},
  {id:'weekly',label:'周反馈',icon:CalendarDays},
  {id:'stage',label:'阶段',icon:GraduationCap},
  {id:'student',label:'学生',icon:UserRound},
];

function App(){
  const [page,setPage]=useState('daily');
  const [scoreMode,setScoreMode]=useState('analysis');
  const [selectedId,setSelectedId]=useState('zhang');
  const [store,setStore]=useSavedState();
  const studentList=(store.students?.length?store.students:students).map(student=>({...student,...(store.profiles?.[student.id]||{})}));
  const [toast,setToast]=useState('');
  const toastTimer=useRef(null);
  useEffect(()=>{if(studentList.length&&!studentList.some(student=>student.id===selectedId))setSelectedId(studentList[0].id)},[selectedId,studentList]);
  const notify=message=>{setToast(message);window.clearTimeout(toastTimer.current);toastTimer.current=window.setTimeout(()=>setToast(''),1800)};
  const common={selectedId,setSelectedId,studentList,store,setStore,notify};
  let screen;
  if(page==='daily')screen=<DailyPage {...common}/>;
  if(page==='weekly')screen=<WeeklyPage {...common}/>;
  if(page==='stage')screen=<StagePage {...common}/>;
  if(page==='student')screen=<StudentPage {...common} onOpenScores={mode=>{setScoreMode(mode);setPage('scores')}}/>;
  if(page==='scores')screen=<ScorePage {...common} initialMode={scoreMode} onBack={()=>setPage('student')}/>;
  return <div className="app-frame"><div className="mobile-app">{screen}<nav className="bottom-nav">{navItems.map(item=>{const Icon=item.icon;const active=page===item.id||(page==='scores'&&item.id==='student');return <button key={item.id} className={active?'active':''} onClick={()=>setPage(item.id)}><Icon size={21}/><span>{item.label}</span></button>})}</nav><Toast message={toast}/></div></div>
}

createRoot(document.getElementById('root')).render(<App/>);
