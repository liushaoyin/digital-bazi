const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const app = express();

// DeepSeek API 配置
const DEEPSEEK_API_KEY = 'sk-86abd23433e94d1fa5266565f9a7f32f';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 五行生克关系
const wuxingRelations = {
    '木': { '生': '火', '克': '土', '被生': '水', '被克': '金' },
    '火': { '生': '土', '克': '金', '被生': '木', '被克': '水' },
    '土': { '生': '金', '克': '水', '被生': '火', '被克': '木' },
    '金': { '生': '水', '克': '木', '被生': '土', '被克': '火' },
    '水': { '生': '木', '克': '火', '被生': '金', '被克': '土' }
};

// 天干五行对应
const ganWuxing = {
    '甲': '木', '乙': '木',
    '丙': '火', '丁': '火',
    '戊': '土', '己': '土',
    '庚': '金', '辛': '金',
    '壬': '水', '癸': '水'
};

// 地支五行对应
const zhiWuxing = {
    '子': '水', '丑': '土',
    '寅': '木', '卯': '木',
    '辰': '土', '巳': '火',
    '午': '火', '未': '土',
    '申': '金', '酉': '金',
    '戌': '土', '亥': '水'
};

// 获取年龄阶段
function getAgeStage(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    
    if (age < 1) {
        const months = (today.getFullYear() - birth.getFullYear()) * 12 + 
                      (today.getMonth() - birth.getMonth());
        if (months < 3) return 'newborn';
        if (months < 6) return 'infant';
        return 'baby';
    }
    if (age < 3) return 'toddler';
    if (age < 6) return 'preschooler';
    if (age < 12) return 'child';
    if (age < 18) return 'teenager';
    if (age < 35) return 'youngAdult';
    if (age < 50) return 'middleAge';
    if (age < 65) return 'preRetirement';
    return 'retirement';
}

// 获取退休年龄
function getRetirementAge(gender) {
    return gender === 'male' ? 60 : 55;
}

// 分析性格特征
function analyzePersonality(bazi, gender, address, ageStage) {
    const { dayMaster, favorableElements, unfavorableElements } = bazi;
    let personality = '';
    
    // 基础性格分析
    switch(dayMaster) {
        case '甲':
            personality = gender === '男' ? 
                '性格刚强，有领导才能，做事果断，适合担任管理职位' : 
                '性格坚强，独立自主，做事干练，适合担任重要职务';
            break;
        case '乙':
            personality = gender === '男' ? 
                '性格温和，善于协调，有耐心，适合从事服务行业' : 
                '性格柔韧，善于沟通，有同理心，适合从事教育或医疗行业';
            break;
        case '丙':
            personality = gender === '男' ? 
                '性格开朗，热情奔放，富有创造力，适合从事创意工作' : 
                '性格活泼，充满活力，富有想象力，适合从事艺术或设计工作';
            break;
        case '丁':
            personality = gender === '男' ? 
                '性格细腻，做事认真，注重细节，适合从事技术工作' : 
                '性格细致，做事专注，追求完美，适合从事研究工作';
            break;
        case '戊':
            personality = gender === '男' ? 
                '性格稳重，踏实可靠，重视责任，适合从事管理工作' : 
                '性格沉稳，做事踏实，注重家庭，适合从事行政工作';
            break;
        case '己':
            personality = gender === '男' ? 
                '性格温和，善于包容，注重和谐，适合从事外交工作' : 
                '性格柔顺，善解人意，注重关系，适合从事人力资源工作';
            break;
        case '庚':
            personality = gender === '男' ? 
                '性格坚毅，做事果断，重视原则，适合从事法律工作' : 
                '性格坚强，做事利落，注重规则，适合从事审计工作';
            break;
        case '辛':
            personality = gender === '男' ? 
                '性格敏锐，思维灵活，善于观察，适合从事分析工作' : 
                '性格敏锐，思维敏捷，善于发现，适合从事研究工作';
            break;
        case '壬':
            personality = gender === '男' ? 
                '性格随和，适应力强，善于变通，适合从事销售工作' : 
                '性格灵活，适应性强，善于交际，适合从事公关工作';
            break;
        case '癸':
            personality = gender === '男' ? 
                '性格内敛，思维缜密，注重细节，适合从事研究工作' : 
                '性格含蓄，思维细腻，注重品质，适合从事设计工作';
            break;
    }
    
    // 根据年龄阶段补充分析
    switch(ageStage) {
        case 'infant':
            personality += '\n\n处于人生最关键的成长阶段，父母需注意：\n1. 培养良好的性格基础\n2. 建立安全感\n3. 发展认知能力';
            break;
        case 'toddler':
            personality += '\n\n处于启蒙阶段，父母需注意：\n1. 培养探索精神\n2. 发展语言能力\n3. 建立规则意识';
            break;
        case 'child':
            personality += '\n\n处于学习阶段，父母需注意：\n1. 培养学习兴趣\n2. 发展社交能力\n3. 建立自信心';
            break;
        case 'teenager':
            personality += '\n\n处于成长阶段，建议：\n1. 培养独立思考能力\n2. 发展个人特长\n3. 建立正确价值观';
            break;
        case 'youngAdult':
            personality += '\n\n处于事业发展期，建议：\n1. 明确职业方向\n2. 提升专业能力\n3. 建立人脉网络';
            break;
        case 'middleAge':
            personality += '\n\n处于事业稳定期，建议：\n1. 发挥专业优势\n2. 注重团队管理\n3. 平衡工作生活';
            break;
        case 'preRetirement':
            personality += '\n\n处于事业转型期，建议：\n1. 传授经验\n2. 培养接班人\n3. 规划退休生活';
            break;
        case 'retirement':
            personality += '\n\n处于养老阶段，建议：\n1. 保持适度工作\n2. 发挥余热\n3. 享受生活';
            break;
    }

    // 加入喜忌神分析
    if (favorableElements) {
        personality += `\n\n喜用神分析：\n您的八字喜用神为${favorableElements}，这意味着：\n`;
        if (favorableElements.includes('水')) {
            personality += '- 水主智慧，有利于学习和思考\n';
            personality += '- 适合从事需要智慧的工作，如教育、研究等\n';
            personality += '- 有利于发展思维能力和创造力\n';
        }
        if (favorableElements.includes('金')) {
            personality += '- 金主果断，有利于决策和行动\n';
            personality += '- 适合从事需要决断力的工作，如管理、法律等\n';
            personality += '- 有利于培养领导能力和执行力\n';
        }
        if (favorableElements.includes('木')) {
            personality += '- 木主成长，有利于发展和进步\n';
            personality += '- 适合从事需要创新能力的工作，如设计、艺术等\n';
            personality += '- 有利于培养进取心和创造力\n';
        }
        if (favorableElements.includes('火')) {
            personality += '- 火主热情，有利于社交和表达\n';
            personality += '- 适合从事需要沟通能力的工作，如销售、公关等\n';
            personality += '- 有利于培养表达能力和社交能力\n';
        }
        if (favorableElements.includes('土')) {
            personality += '- 土主稳重，有利于积累和沉淀\n';
            personality += '- 适合从事需要耐心的工作，如行政、服务等\n';
            personality += '- 有利于培养责任心和执行力\n';
        }
    }

    if (unfavorableElements) {
        personality += `\n忌用神分析：\n您的八字忌用神为${unfavorableElements}，需要注意：\n`;
        if (unfavorableElements.includes('水')) {
            personality += '- 避免过于感性，保持理性思考\n';
            personality += '- 注意控制情绪，避免感情用事\n';
            personality += '- 培养逻辑思维和判断能力\n';
        }
        if (unfavorableElements.includes('金')) {
            personality += '- 避免过于固执，保持灵活性\n';
            personality += '- 注意听取他人意见，避免独断专行\n';
            personality += '- 培养包容心和适应能力\n';
        }
        if (unfavorableElements.includes('木')) {
            personality += '- 避免过于急躁，保持耐心\n';
            personality += '- 注意循序渐进，避免急于求成\n';
            personality += '- 培养耐心和毅力\n';
        }
        if (unfavorableElements.includes('火')) {
            personality += '- 避免过于冲动，保持冷静\n';
            personality += '- 注意控制情绪，避免意气用事\n';
            personality += '- 培养自控力和判断力\n';
        }
        if (unfavorableElements.includes('土')) {
            personality += '- 避免过于保守，保持创新\n';
            personality += '- 注意开拓进取，避免固步自封\n';
            personality += '- 培养创新精神和进取心\n';
        }
    }

    return personality;
}

// 分析财运
function analyzeWealth(bazi, gender, address) {
    const ageStage = getAgeStage(bazi.solarDate);
    const favorableElements = bazi.favorableElements.split(' ');
    const unfavorableElements = bazi.unfavorableElements.split(' ');
    
    let analysis = '';
    
    // 根据八字分析财运
    if (favorableElements.includes('金')) {
        analysis += '八字中金为喜用神，财运较旺。适合从事金融、投资、珠宝等行业。';
    } else if (unfavorableElements.includes('金')) {
        analysis += '八字中金为忌神，财运较弱。建议：\n1. 稳健理财\n2. 避免投机\n3. 注重积累';
    }
    
    if (favorableElements.includes('水')) {
        analysis += '水为喜用神，适合从事流动性强的行业，如贸易、物流、旅游等。';
    }
    
    if (favorableElements.includes('木')) {
        analysis += '木为喜用神，适合从事创新性行业，如科技、教育、文化等。';
    }
    
    if (favorableElements.includes('火')) {
        analysis += '火为喜用神，适合从事服务性行业，如餐饮、娱乐、传媒等。';
    }
    
    if (favorableElements.includes('土')) {
        analysis += '土为喜用神，适合从事稳定性行业，如房地产、建筑、农业等。';
    }
    
    if (unfavorableElements.includes('火')) {
        analysis += '火为忌神，需注意：\n1. 避免冲动消费\n2. 控制投资风险\n3. 保持理性决策';
    }
    
    // 根据年龄阶段给出建议
    switch(ageStage) {
        case 'infant':
            analysis += '\n\n处于人生最关键的成长阶段，父母需注意：\n1. 合理规划教育投资\n2. 建立教育基金\n3. 关注成长需求';
            break;
        case 'toddler':
            analysis += '\n\n处于启蒙阶段，父母需注意：\n1. 培养理财意识\n2. 合理规划教育支出\n3. 关注发展需求';
            break;
        case 'child':
            analysis += '\n\n处于学习阶段，建议：\n1. 培养理财观念\n2. 学习理财知识\n3. 参与家庭理财';
            break;
        case 'teenager':
            analysis += '\n\n处于成长阶段，建议：\n1. 学习理财知识\n2. 培养正确的金钱观\n3. 开始小额理财实践';
            break;
        case 'youngAdult':
            analysis += '\n\n处于事业发展期，建议：\n1. 加强学习，提升能力\n2. 寻找副业机会\n3. 严格控制支出\n4. 开始长期投资规划';
            break;
        case 'middleAge':
            analysis += '\n\n处于事业稳定期，建议：\n1. 稳健投资\n2. 分散风险\n3. 注重资产配置\n4. 关注养老规划';
            break;
        case 'preRetirement':
            analysis += '\n\n处于事业转型期，建议：\n1. 保守理财\n2. 注重养老规划\n3. 控制风险\n4. 准备退休金';
            break;
        case 'retirement':
            analysis += '\n\n处于养老阶段，建议：\n1. 稳健理财\n2. 合理消费\n3. 注重健康投资\n4. 享受退休生活';
            break;
    }
    
    return analysis;
}

// 分析事业运势
function analyzeCareer(bazi, gender, address) {
    const ageStage = getAgeStage(bazi.solarDate);
    const favorableElements = bazi.favorableElements.split(' ');
    const unfavorableElements = bazi.unfavorableElements.split(' ');
    
    let analysis = '';
    
    // 根据八字分析事业
    if (favorableElements.includes('木')) {
        analysis += '八字中木为喜用神，适合从事创新、教育、文化等行业。具有发展潜力和创造力。';
    } else if (unfavorableElements.includes('木')) {
        analysis += '八字中木为忌神，需注意：\n1. 避免过于激进\n2. 保持稳健发展\n3. 注重积累经验';
    }
    
    if (favorableElements.includes('土')) {
        analysis += '土为喜用神，适合从事稳定、管理类工作。具有责任心和执行力。';
    }
    
    if (favorableElements.includes('金')) {
        analysis += '金为喜用神，适合从事金融、法律、管理等工作。具有决断力和领导力。';
    }
    
    if (favorableElements.includes('水')) {
        analysis += '水为喜用神，适合从事贸易、物流、旅游等工作。具有适应力和变通能力。';
    }
    
    if (favorableElements.includes('火')) {
        analysis += '火为喜用神，适合从事服务、销售、传媒等工作。具有表达力和社交能力。';
    }
    
    if (unfavorableElements.includes('金')) {
        analysis += '金为忌神，需注意：\n1. 避免过于刻板\n2. 保持灵活性\n3. 注重创新思维';
    }
    
    // 根据年龄阶段给出建议
    switch(ageStage) {
        case 'infant':
            analysis += '\n\n处于人生最关键的成长阶段，父母需注意：\n1. 营造良好的成长环境\n2. 培养兴趣爱好\n3. 关注智力发展';
            break;
        case 'toddler':
            analysis += '\n\n处于启蒙阶段，父母需注意：\n1. 培养观察力\n2. 发展动手能力\n3. 建立学习兴趣';
            break;
        case 'child':
            analysis += '\n\n处于学习阶段，建议：\n1. 培养学习兴趣\n2. 发展特长\n3. 建立自信心';
            break;
        case 'teenager':
            analysis += '\n\n处于成长阶段，建议：\n1. 培养独立思考能力\n2. 发展个人特长\n3. 规划未来方向\n4. 开始职业探索';
            break;
        case 'youngAdult':
            analysis += '\n\n处于事业发展期，建议：\n1. 循序渐进地发展\n2. 注重积累经验\n3. 保持良好的人际关系\n4. 持续学习提升';
            break;
        case 'middleAge':
            analysis += '\n\n处于事业稳定期，建议：\n1. 发挥专业优势\n2. 注重团队管理\n3. 培养接班人\n4. 关注行业趋势';
            break;
        case 'preRetirement':
            analysis += '\n\n处于事业转型期，建议：\n1. 传授经验\n2. 培养新人\n3. 规划退休生活\n4. 保持适度工作';
            break;
        case 'retirement':
            analysis += '\n\n处于养老阶段，建议：\n1. 保持适度工作\n2. 发挥余热\n3. 享受生活\n4. 关注健康';
            break;
    }
    
    return analysis;
}

// 分析健康状况
function analyzeHealth(bazi, gender, address) {
    const ageStage = getAgeStage(bazi.solarDate);
    const favorableElements = bazi.favorableElements.split(' ');
    const unfavorableElements = bazi.unfavorableElements.split(' ');
    
    let analysis = '';
    
    // 根据八字分析健康
    if (favorableElements.includes('水')) {
        analysis += '八字中水为喜用神，肾脏功能较好，但需注意保暖。建议：\n1. 保持充足水分\n2. 注意保暖\n3. 适当运动';
    } else if (unfavorableElements.includes('水')) {
        analysis += '八字中水为忌神，需注意：\n1. 保护肾脏\n2. 注意泌尿系统\n3. 保持规律作息';
    }
    
    if (favorableElements.includes('火')) {
        analysis += '火为喜用神，心脏功能较好，但需注意情绪管理。建议：\n1. 保持心情愉悦\n2. 适当运动\n3. 注意休息';
    }
    
    if (favorableElements.includes('木')) {
        analysis += '木为喜用神，肝脏功能较好，但需注意情绪调节。建议：\n1. 保持良好作息\n2. 注意饮食\n3. 适当运动';
    }
    
    if (favorableElements.includes('金')) {
        analysis += '金为喜用神，肺部功能较好，但需注意呼吸系统。建议：\n1. 保持空气清新\n2. 适当运动\n3. 注意保暖';
    }
    
    if (favorableElements.includes('土')) {
        analysis += '土为喜用神，脾胃功能较好，但需注意饮食。建议：\n1. 规律饮食\n2. 注意营养\n3. 保持运动';
    }
    
    if (unfavorableElements.includes('土')) {
        analysis += '土为忌神，需注意：\n1. 保护脾胃\n2. 注意饮食\n3. 保持运动';
    }
    
    // 根据年龄阶段给出建议
    switch(ageStage) {
        case 'infant':
            analysis += '\n\n处于人生最关键的成长阶段，父母需注意：\n1. 营养均衡\n2. 定期体检\n3. 预防接种\n4. 关注生长发育';
            break;
        case 'toddler':
            analysis += '\n\n处于启蒙阶段，父母需注意：\n1. 培养良好生活习惯\n2. 加强运动\n3. 注意安全\n4. 关注营养均衡';
            break;
        case 'child':
            analysis += '\n\n处于学习阶段，需注意：\n1. 保护视力\n2. 保持运动\n3. 营养均衡\n4. 关注生长发育';
            break;
        case 'teenager':
            analysis += '\n\n处于成长阶段，需注意：\n1. 保持规律作息\n2. 适当运动\n3. 注意饮食均衡\n4. 关注心理健康';
            break;
        case 'youngAdult':
            analysis += '\n\n处于事业发展期，需注意：\n1. 保持规律作息\n2. 适当运动\n3. 注意饮食均衡\n4. 关注压力管理';
            break;
        case 'middleAge':
            analysis += '\n\n处于事业稳定期，需注意：\n1. 定期体检\n2. 控制压力\n3. 保持运动\n4. 关注慢性病预防';
            break;
        case 'preRetirement':
            analysis += '\n\n处于事业转型期，需注意：\n1. 预防慢性病\n2. 保持运动\n3. 定期体检\n4. 关注心理健康';
            break;
        case 'retirement':
            analysis += '\n\n处于养老阶段，需注意：\n1. 保持适度运动\n2. 定期体检\n3. 保持良好心态\n4. 关注慢性病管理';
            break;
    }
    
    return analysis;
}

// 分析婚姻感情
function analyzeMarriage(bazi, gender, address) {
    const ageStage = getAgeStage(bazi.solarDate);
    const favorableElements = bazi.favorableElements.split(' ');
    const unfavorableElements = bazi.unfavorableElements.split(' ');
    
    let analysis = '';
    
    // 根据八字分析婚姻
    if (favorableElements.includes('木')) {
        analysis += '八字中木为喜用神，感情生活较为和谐。具有包容心和同理心。';
    } else if (unfavorableElements.includes('木')) {
        analysis += '八字中木为忌神，需注意：\n1. 改善沟通方式\n2. 保持耐心\n3. 注重理解';
    }
    
    if (favorableElements.includes('水')) {
        analysis += '水为喜用神，感情较为细腻，但需注意情绪管理。建议：\n1. 保持理性\n2. 注意沟通\n3. 控制情绪';
    }
    
    if (favorableElements.includes('火')) {
        analysis += '火为喜用神，感情较为热情，但需注意表达方式。建议：\n1. 保持热情\n2. 注意分寸\n3. 尊重对方';
    }
    
    if (favorableElements.includes('土')) {
        analysis += '土为喜用神，感情较为稳定，但需注意变化。建议：\n1. 保持稳定\n2. 注意创新\n3. 保持新鲜感';
    }
    
    if (favorableElements.includes('金')) {
        analysis += '金为喜用神，感情较为理性，但需注意感性。建议：\n1. 保持理性\n2. 注意感性\n3. 平衡关系';
    }
    
    if (unfavorableElements.includes('火')) {
        analysis += '火为忌神，需注意：\n1. 避免冲动\n2. 保持冷静\n3. 理性处理';
    }
    
    // 根据年龄阶段给出建议
    switch(ageStage) {
        case 'infant':
            analysis += '\n\n处于人生最关键的成长阶段，父母需注意：\n1. 营造良好的家庭氛围\n2. 培养安全感\n3. 关注情感发展';
            break;
        case 'toddler':
            analysis += '\n\n处于启蒙阶段，父母需注意：\n1. 培养社交能力\n2. 建立情感联系\n3. 关注性格发展';
            break;
        case 'child':
            analysis += '\n\n处于学习阶段，建议：\n1. 培养良好的人际交往能力\n2. 学习情感表达\n3. 建立自信心';
            break;
        case 'teenager':
            analysis += '\n\n处于成长阶段，建议：\n1. 培养正确的感情观\n2. 学习人际交往\n3. 保持适度社交\n4. 关注心理健康';
            break;
        case 'youngAdult':
            analysis += '\n\n处于事业发展期，建议：\n1. 保持良好沟通\n2. 互相理解包容\n3. 共同成长\n4. 平衡工作与感情';
            break;
        case 'middleAge':
            analysis += '\n\n处于事业稳定期，建议：\n1. 维护感情\n2. 互相支持\n3. 共同规划\n4. 保持新鲜感';
            break;
        case 'preRetirement':
            analysis += '\n\n处于事业转型期，建议：\n1. 互相理解\n2. 共同规划\n3. 享受生活\n4. 关注感情质量';
            break;
        case 'retirement':
            analysis += '\n\n处于养老阶段，建议：\n1. 互相照顾\n2. 共同活动\n3. 享受天伦\n4. 保持感情活力';
            break;
    }
    
    return analysis;
}

// 主分析函数
function analyzeBazi(bazi, gender, address) {
    const ageStage = getAgeStage(bazi.solarDate);
    
    // 获取太岁信息
    const currentYear = new Date().getFullYear();
    const birthYear = new Date(bazi.solarDate).getFullYear();
    const age = currentYear - birthYear;
    
    // 计算太岁
    const taiSui = (currentYear - 4) % 12;
    const birthTaiSui = (birthYear - 4) % 12;
    
    // 判断是否犯太岁
    const isTaiSui = taiSui === birthTaiSui;
    const isChongTaiSui = Math.abs(taiSui - birthTaiSui) === 6;
    const isPoTaiSui = Math.abs(taiSui - birthTaiSui) === 3;
    const isHaiTaiSui = Math.abs(taiSui - birthTaiSui) === 1;
    
    let taiSuiAnalysis = '';
    if (isTaiSui) {
        taiSuiAnalysis = `\n\n太岁分析：\n${currentYear}年正值本命年，需要特别注意：\n1. 避免重大决策和变动\n2. 注意身体健康，特别是本命年易犯的疾病\n3. 保持低调谨慎，避免冲动行事\n4. 可以佩戴本命年吉祥物\n5. 注意人际关系，避免口舌是非`;
    } else if (isChongTaiSui) {
        taiSuiAnalysis = `\n\n太岁分析：\n${currentYear}年正值冲太岁，需要特别注意：\n1. 避免冲动行事，保持冷静\n2. 注意人际关系，避免冲突\n3. 保持平和心态，避免情绪波动\n4. 可以佩戴化解冲太岁的吉祥物\n5. 注意身体健康，特别是与冲太岁相关的部位`;
    } else if (isPoTaiSui) {
        taiSuiAnalysis = `\n\n太岁分析：\n${currentYear}年正值破太岁，需要特别注意：\n1. 避免破财，注意理财\n2. 注意身体健康，特别是与破太岁相关的部位\n3. 保持谨慎，避免冒险\n4. 可以佩戴化解破太岁的吉祥物\n5. 注意人际关系，避免破财破运`;
    } else if (isHaiTaiSui) {
        taiSuiAnalysis = `\n\n太岁分析：\n${currentYear}年正值害太岁，需要特别注意：\n1. 避免小人陷害，注意人际关系\n2. 注意身体健康，特别是与害太岁相关的部位\n3. 保持警惕，避免上当受骗\n4. 可以佩戴化解害太岁的吉祥物\n5. 注意言行，避免招惹是非`;
    }
    
    // 分析喜忌用神
    const favorableElements = bazi.favorableElements.split(' ');
    const unfavorableElements = bazi.unfavorableElements.split(' ');
    
    let elementsAnalysis = '\n\n喜忌用神分析：\n';
    
    // 分析喜用神
    elementsAnalysis += '喜用神：\n';
    favorableElements.forEach(element => {
        switch(element) {
            case '水':
                elementsAnalysis += '- 水主智慧，有利于学习和思考\n';
                elementsAnalysis += '- 适合从事需要智慧的工作，如教育、研究等\n';
                elementsAnalysis += '- 有利于发展思维能力和创造力\n';
                elementsAnalysis += '- 建议多接触水相关的事物，如游泳、钓鱼等\n';
                break;
            case '金':
                elementsAnalysis += '- 金主果断，有利于决策和行动\n';
                elementsAnalysis += '- 适合从事需要决断力的工作，如管理、法律等\n';
                elementsAnalysis += '- 有利于培养领导能力和执行力\n';
                elementsAnalysis += '- 建议多接触金属相关的事物，如佩戴金饰等\n';
                break;
            case '木':
                elementsAnalysis += '- 木主成长，有利于发展和进步\n';
                elementsAnalysis += '- 适合从事需要创新能力的工作，如设计、艺术等\n';
                elementsAnalysis += '- 有利于培养进取心和创造力\n';
                elementsAnalysis += '- 建议多接触植物，如养花、种树等\n';
                break;
            case '火':
                elementsAnalysis += '- 火主热情，有利于社交和表达\n';
                elementsAnalysis += '- 适合从事需要沟通能力的工作，如销售、公关等\n';
                elementsAnalysis += '- 有利于培养表达能力和社交能力\n';
                elementsAnalysis += '- 建议多接触阳光，保持积极向上的心态\n';
                break;
            case '土':
                elementsAnalysis += '- 土主稳重，有利于积累和沉淀\n';
                elementsAnalysis += '- 适合从事需要耐心的工作，如行政、服务等\n';
                elementsAnalysis += '- 有利于培养责任心和执行力\n';
                elementsAnalysis += '- 建议多接触土地，如园艺、户外活动等\n';
                break;
        }
    });
    
    // 分析忌用神
    elementsAnalysis += '\n忌用神：\n';
    unfavorableElements.forEach(element => {
        switch(element) {
            case '水':
                elementsAnalysis += '- 避免过于感性，保持理性思考\n';
                elementsAnalysis += '- 注意控制情绪，避免感情用事\n';
                elementsAnalysis += '- 培养逻辑思维和判断能力\n';
                elementsAnalysis += '- 避免过度接触水相关的事物\n';
                break;
            case '金':
                elementsAnalysis += '- 避免过于固执，保持灵活性\n';
                elementsAnalysis += '- 注意听取他人意见，避免独断专行\n';
                elementsAnalysis += '- 培养包容心和适应能力\n';
                elementsAnalysis += '- 避免过度接触金属相关的事物\n';
                break;
            case '木':
                elementsAnalysis += '- 避免过于急躁，保持耐心\n';
                elementsAnalysis += '- 注意循序渐进，避免急于求成\n';
                elementsAnalysis += '- 培养耐心和毅力\n';
                elementsAnalysis += '- 避免过度接触植物\n';
                break;
            case '火':
                elementsAnalysis += '- 避免过于冲动，保持冷静\n';
                elementsAnalysis += '- 注意控制情绪，避免意气用事\n';
                elementsAnalysis += '- 培养自控力和判断力\n';
                elementsAnalysis += '- 避免过度接触阳光和高温\n';
                break;
            case '土':
                elementsAnalysis += '- 避免过于保守，保持创新\n';
                elementsAnalysis += '- 注意开拓进取，避免固步自封\n';
                elementsAnalysis += '- 培养创新精神和进取心\n';
                elementsAnalysis += '- 避免过度接触土地\n';
                break;
        }
    });
    
    const analysis = {
        personality: analyzePersonality(bazi, gender, address, ageStage),
        wealth: analyzeWealth(bazi, gender, address),
        career: analyzeCareer(bazi, gender, address),
        health: analyzeHealth(bazi, gender, address),
        marriage: analyzeMarriage(bazi, gender, address)
    };
    
    // 为每个分析结果添加太岁和喜忌用神信息
    for (let key in analysis) {
        analysis[key] += taiSuiAnalysis + elementsAnalysis;
    }
    
    return analysis;
}

// 生成 DeepSeek 提示词
function generatePrompt(bazi, gender, address, baseAnalysis) {
    // 计算年龄
    const birthDate = new Date(bazi.solarDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const ageGroup = age < 1 ? '婴儿' : 
                    age < 3 ? '幼儿' :
                    age < 6 ? '学龄前' :
                    age < 12 ? '儿童' :
                    age < 18 ? '青少年' :
                    age < 30 ? '青年' :
                    age < 50 ? '中年' :
                    '老年';

    return `作为一个专业的命理分析师，请根据以下八字信息，结合传统命理和现代心理学，提供更深入和个性化的分析：

八字信息：
- 出生日期：${bazi.solarDate}（公历）
- 农历日期：${bazi.lunarDate}
- 年柱：${bazi.yearGan}${bazi.yearZhi}
- 月柱：${bazi.monthGan}${bazi.monthZhi}
- 日柱：${bazi.dayGan}${bazi.dayZhi}
- 时柱：${bazi.hourGan}${bazi.hourZhi}
- 日主：${bazi.dayMaster}
- 五行：${bazi.fiveElements}
- 喜用神：${bazi.favorableElements}
- 忌用神：${bazi.unfavorableElements}
- 性别：${gender}
- 住址：${address}
- 年龄：${age}岁
- 年龄段：${ageGroup}

基础分析结果：
${JSON.stringify(baseAnalysis, null, 2)}

请基于以上信息，提供更深入和个性化的分析。请严格按照以下 JSON 格式返回分析结果：
{
    "personality": "性格特征分析，包括优势和潜在挑战。${age < 18 ? '对于未成年人，请特别关注其成长特点和家庭教育建议' : ''}",
    "wealth": "${age < 18 ? '学业运势分析，包括学习特点和培养方向' : '财运分析，包括近期走势和具体建议'}",
    "career": "${age < 18 ? '未来发展分析，包括兴趣培养和职业规划建议' : '事业运势分析，包括职业发展建议'}",
    "health": "${age < 18 ? '生长发育分析，包括体质特点和保健建议' : '健康状况分析，包括需要注意的方面'}",
    "marriage": "${age < 18 ? '家庭关系分析，包括亲子关系和家庭教育建议' : '婚姻感情分析，包括相处建议'}"
}

请确保：
- 分析更加个性化和具体，特别考虑年龄特点
- 结合现代生活实际，提供适合当前年龄段的建议
- 提供可操作的建议，避免过于抽象
- 语言温暖积极，避免消极暗示
- 保持专业性，同时考虑不同年龄段的认知特点
- 对于未成年人，重点关注成长、教育和未来发展
- 对于成年人，重点关注事业、财运和感情
- 严格按照 JSON 格式返回，不要添加任何其他内容`;
}

// 调用 DeepSeek API
async function getDeepSeekAnalysis(bazi, gender, address, baseAnalysis) {
    try {
        const prompt = generatePrompt(bazi, gender, address, baseAnalysis);
        
        console.log('正在调用 DeepSeek API...');
        
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的命理分析师，擅长结合传统命理和现代心理学进行分析。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('DeepSeek API 错误:', errorData);
            throw new Error(`DeepSeek API 错误: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        console.log('DeepSeek API 调用成功');
        return data.choices[0].message.content;
    } catch (error) {
        console.error('DeepSeek API 调用失败:', error);
        return null;
    }
}

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ 
        error: '服务器内部错误',
        details: err.message
    });
});

// 启用 CORS
app.use(cors({
    origin: ['http://localhost:8081', 'http://127.0.0.1:8081', 'http://localhost:3000', 'http://127.0.0.1:3000', 'https://liushaoyin.github.io'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Origin']
}));

// 解析 JSON 请求体
app.use(express.json());

// 提供静态文件服务
app.use(express.static(path.join(__dirname)));

// 添加请求日志中间件
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// API 路由
app.post('/api/analyze', async (req, res) => {
    try {
        console.log('收到分析请求:', JSON.stringify(req.body, null, 2));
        
        // 获取基础分析结果，传入性别和居住地参数
        const baseAnalysis = analyzeBazi(req.body.bazi, req.body.gender, req.body.address);
        
        // 调用 DeepSeek 获取更深入的分析
        const deepseekAnalysis = await getDeepSeekAnalysis(
            req.body.bazi,
            req.body.gender,
            req.body.address,
            baseAnalysis
        );

        // 如果 DeepSeek 分析成功，使用其结果
        if (deepseekAnalysis) {
            try {
                // 尝试解析返回的内容
                const analysis = JSON.parse(deepseekAnalysis);
                // 验证返回的数据结构
                if (analysis && 
                    typeof analysis === 'object' && 
                    'personality' in analysis && 
                    'wealth' in analysis && 
                    'career' in analysis && 
                    'health' in analysis && 
                    'marriage' in analysis) {
                    console.log('返回分析结果:', JSON.stringify(analysis, null, 2));
                    res.json(analysis);
                } else {
                    throw new Error('返回的数据结构不完整');
                }
            } catch (error) {
                console.log('DeepSeek 结果解析失败，使用基础分析结果');
                res.json(baseAnalysis);
            }
        } else {
            // 如果 DeepSeek 调用失败，使用基础分析结果
            console.log('DeepSeek 调用失败，使用基础分析结果');
            res.json(baseAnalysis);
        }
    } catch (error) {
        console.error('处理请求错误:', error);
        res.status(500).json({ 
            error: '服务器错误，请稍后重试',
            details: error.message
        });
    }
});

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 修改服务器启动代码
const PORT = process.env.PORT || 3000;
const PORT2 = process.env.PORT2 || 8081;

// 创建两个服务器实例
const server = app.listen(PORT, () => {
    console.log(`开发服务器运行在 http://localhost:${PORT}`);
});

const server2 = app.listen(PORT2, () => {
    console.log(`开发服务器运行在 http://localhost:${PORT2}`);
});

// 错误处理
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
        console.error(`端口 ${PORT} 已被占用`);
        } else {
            console.error('服务器错误:', error);
        }
});

server2.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`端口 ${PORT2} 已被占用`);
    } else {
        console.error('服务器错误:', error);
    }
});

console.log('CORS 已启用，允许的源:', ['http://localhost:8081', 'http://127.0.0.1:8081', 'http://localhost:3000', 'http://127.0.0.1:3000', 'https://liushaoyin.github.io']); 