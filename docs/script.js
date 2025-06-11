// Cookie 处理函数
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict; Secure";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999; path=/; SameSite=Strict; Secure';
}

// 检查依赖是否加载
function checkDependencies() {
    if (typeof Lunar === 'undefined') {
        throw new Error('Lunar.js 未加载');
    }
    if (typeof flatpickr === 'undefined') {
        throw new Error('Flatpickr 未加载');
    }
}

// 获取当前时辰
function getCurrentHour() {
    const now = new Date();
    const hour = now.getHours();
    // 将24小时制转换为时辰
    const hourMap = {
        23: 0, 0: 0,  // 子时
        1: 2, 2: 2,   // 丑时
        3: 4, 4: 4,   // 寅时
        5: 6, 6: 6,   // 卯时
        7: 8, 8: 8,   // 辰时
        9: 10, 10: 10, // 巳时
        11: 12, 12: 12, // 午时
        13: 14, 14: 14, // 未时
        15: 16, 16: 16, // 申时
        17: 18, 18: 18, // 酉时
        19: 20, 20: 20, // 戌时
        21: 22, 22: 22  // 亥时
    };
    return hourMap[hour] || 0;
}

// 初始化日期选择器
function initDatePicker() {
    const dateTypeRadios = document.querySelectorAll('input[name="dateType"]');
    const birthdateInput = document.getElementById('birthdate');
    let flatpickrInstance = null;

    // 初始化公历日期选择器
    function initSolarDatePicker() {
        if (flatpickrInstance) {
            flatpickrInstance.destroy();
        }
        
        flatpickrInstance = flatpickr(birthdateInput, {
            locale: 'zh',
            dateFormat: 'Y-m-d',
            maxDate: 'today',
            disableMobile: true,
            onChange: function(selectedDates, dateStr) {
                checkAndSubmit();
            }
        });
    }

    // 初始化农历日期选择器
    function initLunarDatePicker() {
        if (flatpickrInstance) {
            flatpickrInstance.destroy();
        }

        // 创建农历年份选项
        const currentYear = new Date().getFullYear();
        const yearOptions = Array.from({length: 100}, (_, i) => currentYear - i);
        
        // 创建农历月份选项
        const monthOptions = Array.from({length: 12}, (_, i) => i + 1);
        
        // 创建农历日期选项
        const dayOptions = Array.from({length: 30}, (_, i) => i + 1);

        // 创建自定义输入框
        const customInput = document.createElement('div');
        customInput.className = 'lunar-date-picker';
        customInput.innerHTML = `
            <select class="lunar-year" id="lunarYear" name="lunarYear"></select>
            <span>年</span>
            <select class="lunar-month" id="lunarMonth" name="lunarMonth"></select>
            <span>月</span>
            <select class="lunar-day" id="lunarDay" name="lunarDay"></select>
            <span>日</span>
        `;

        // 填充选项
        const yearSelect = customInput.querySelector('.lunar-year');
        const monthSelect = customInput.querySelector('.lunar-month');
        const daySelect = customInput.querySelector('.lunar-day');

        yearOptions.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });

        monthOptions.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = month;
            monthSelect.appendChild(option);
        });

        dayOptions.forEach(day => {
            const option = document.createElement('option');
            option.value = day;
            option.textContent = day;
            daySelect.appendChild(option);
        });

        // 替换原始输入框
        birthdateInput.style.display = 'none';
        birthdateInput.parentNode.insertBefore(customInput, birthdateInput);

        // 添加事件监听器
        [yearSelect, monthSelect, daySelect].forEach(select => {
            select.addEventListener('change', function() {
                const year = yearSelect.value;
                const month = monthSelect.value;
                const day = daySelect.value;
                
                // 将农历日期转换为公历日期
                const lunar = Lunar.fromYmd(year, month, day);
                const solar = lunar.getSolar();
                
                // 更新隐藏的输入框值
                birthdateInput.value = `${solar.getYear()}-${String(solar.getMonth()).padStart(2, '0')}-${String(solar.getDay()).padStart(2, '0')}`;
                
                checkAndSubmit();
            });
        });
    }

    // 监听日期类型切换
    dateTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'solar') {
                birthdateInput.style.display = 'block';
                const lunarPicker = document.querySelector('.lunar-date-picker');
                if (lunarPicker) {
                    lunarPicker.remove();
                }
                initSolarDatePicker();
            } else {
                initLunarDatePicker();
            }
        });
    });

    // 初始化公历日期选择器
    initSolarDatePicker();
}

// 获取时辰对应的地支
function getHourZhi(hour) {
    const zhiMap = {
        0: '子', 2: '丑', 4: '寅', 6: '卯',
        8: '辰', 10: '巳', 12: '午', 14: '未',
        16: '申', 18: '酉', 20: '戌', 22: '亥'
    };
    return zhiMap[hour] || '子';
}

// 获取天干
function getGan(index) {
    const gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    return gan[index % 10];
}

// 获取地支
function getZhi(index) {
    const zhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    return zhi[index % 12];
}

// 计算八字
function calculateBaZi(date, hour) {
    try {
        const lunar = Lunar.fromDate(date);
        console.log('计算八字:', {
            date: date.toISOString(),
            lunarYear: lunar.getYear(),
            lunarMonth: lunar.getMonth(),
            lunarDay: lunar.getDay(),
            yearGan: lunar.getYearGan(),
            yearZhi: lunar.getYearZhi(),
            monthGan: lunar.getMonthGan(),
            monthZhi: lunar.getMonthZhi(),
            dayGan: lunar.getDayGan(),
            dayZhi: lunar.getDayZhi()
        });

        const yearGan = lunar.getYearGan();
        const yearZhi = lunar.getYearZhi();
        const monthGan = lunar.getMonthGan();
        const monthZhi = lunar.getMonthZhi();
        const dayGan = lunar.getDayGan();
        const dayZhi = lunar.getDayZhi();
        const hourZhi = getHourZhi(hour);
        const hourGan = getGan((lunar.getDayGanIndex() * 2 + Math.floor(hour / 2)) % 10);

        return {
            yearGan,
            yearZhi,
            monthGan,
            monthZhi,
            dayGan,
            dayZhi,
            hourGan,
            hourZhi,
            solarDate: date.toLocaleDateString('zh-CN'),
            lunarDate: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`
        };
    } catch (error) {
        console.error('计算八字时出错:', error);
        throw new Error('计算八字失败，请检查输入日期是否正确');
    }
}

// 天干五行值
const ganValues = {
    '甲': { element: '木', value: 100 },
    '乙': { element: '木', value: 100 },
    '丙': { element: '火', value: 100 },
    '丁': { element: '火', value: 100 },
    '戊': { element: '土', value: 100 },
    '己': { element: '土', value: 100 },
    '庚': { element: '金', value: 100 },
    '辛': { element: '金', value: 100 },
    '壬': { element: '水', value: 100 },
    '癸': { element: '水', value: 100 }
};

// 地支藏干值
const zhiValues = {
    '子': { main: { element: '水', value: 100 }, middle: { element: null, value: 0 }, extra: { element: null, value: 0 } },
    '丑': { main: { element: '土', value: 60 }, middle: { element: '水', value: 30 }, extra: { element: '金', value: 10 } },
    '寅': { main: { element: '木', value: 60 }, middle: { element: '火', value: 30 }, extra: { element: '土', value: 10 } },
    '卯': { main: { element: '木', value: 100 }, middle: { element: null, value: 0 }, extra: { element: null, value: 0 } },
    '辰': { main: { element: '土', value: 60 }, middle: { element: '木', value: 30 }, extra: { element: '水', value: 10 } },
    '巳': { main: { element: '火', value: 60 }, middle: { element: '土', value: 30 }, extra: { element: '金', value: 10 } },
    '午': { main: { element: '火', value: 70 }, middle: { element: '土', value: 30 }, extra: { element: null, value: 0 } },
    '未': { main: { element: '土', value: 60 }, middle: { element: '火', value: 30 }, extra: { element: '木', value: 10 } },
    '申': { main: { element: '金', value: 60 }, middle: { element: '水', value: 30 }, extra: { element: '土', value: 10 } },
    '酉': { main: { element: '金', value: 100 }, middle: { element: null, value: 0 }, extra: { element: null, value: 0 } },
    '戌': { main: { element: '土', value: 60 }, middle: { element: '金', value: 30 }, extra: { element: '火', value: 10 } },
    '亥': { main: { element: '水', value: 70 }, middle: { element: '木', value: 30 }, extra: { element: null, value: 0 } }
};

// 五行生克关系
const wuXingRelations = {
    '木': { generates: '火', weakens: '土', restrains: '金', isRestrainedBy: '水', same: '木' },
    '火': { generates: '土', weakens: '金', restrains: '水', isRestrainedBy: '木', same: '火' },
    '土': { generates: '金', weakens: '水', restrains: '木', isRestrainedBy: '火', same: '土' },
    '金': { generates: '水', weakens: '木', restrains: '火', isRestrainedBy: '土', same: '金' },
    '水': { generates: '木', weakens: '火', restrains: '土', isRestrainedBy: '金', same: '水' }
};

// 旺相休囚死权重
const wangXiangXiuQiuSi = {
    '旺': 2.00,
    '相': 1.414,
    '休': 1.000,
    '囚': 0.707,
    '死': 0.500
};

// 计算五行状态（旺相休囚死）
function calculateElementState(element, monthZhi) {
    const monthElement = zhiValues[monthZhi].main.element;
    if (element === monthElement) return '旺';
    if (wuXingRelations[monthElement].generates === element) return '相';
    if (wuXingRelations[element].generates === monthElement) return '休';
    if (wuXingRelations[element].restrains === monthElement) return '囚';
    if (wuXingRelations[monthElement].restrains === element) return '死';
    return '休'; // 默认状态
}

// 计算五行力量
function calculateElementStrength(bazi) {
    const elements = {
        '木': 0, '火': 0, '土': 0, '金': 0, '水': 0
    };

    // 计算天干五行力量
    [bazi.yearGan, bazi.monthGan, bazi.dayGan, bazi.hourGan].forEach(gan => {
        const ganInfo = ganValues[gan];
        elements[ganInfo.element] += ganInfo.value;
    });

    // 计算地支藏干五行力量
    [bazi.yearZhi, bazi.monthZhi, bazi.dayZhi, bazi.hourZhi].forEach(zhi => {
        const zhiInfo = zhiValues[zhi];
        if (zhiInfo.main.element) {
            elements[zhiInfo.main.element] += zhiInfo.main.value;
        }
        if (zhiInfo.middle.element) {
            elements[zhiInfo.middle.element] += zhiInfo.middle.value;
        }
        if (zhiInfo.extra.element) {
            elements[zhiInfo.extra.element] += zhiInfo.extra.value;
        }
    });

    return elements;
}

// 计算喜用神和忌用神
function calculateFavorableElements(bazi) {
    // 获取日主五行
    const dayMasterElement = ganValues[bazi.dayGan].element;
    
    // 计算各五行力量
    const elementStrength = calculateElementStrength(bazi);
    
    // 确定帮扶阵营和泄耗阵营
    const supportElements = new Set([dayMasterElement]); // 同
    const weakenElements = new Set();
    
    // 添加生助日主的五行（帮扶阵营）
    supportElements.add(wuXingRelations[dayMasterElement].isRestrainedBy); // 生助日主的五行
    
    // 添加泄耗日主的五行（泄耗阵营）
    weakenElements.add(wuXingRelations[dayMasterElement].weakens); // 被日主生
    weakenElements.add(wuXingRelations[dayMasterElement].restrains); // 克日主
    weakenElements.add(wuXingRelations[dayMasterElement].generates); // 被日主克
    
    // 计算帮扶阵营和泄耗阵营的总力量
    let supportStrength = 0;
    let weakenStrength = 0;
    
    // 根据月令计算旺相休囚死
    const monthZhi = bazi.monthZhi;
    
    // 计算帮扶阵营力量
    supportElements.forEach(element => {
        const state = calculateElementState(element, monthZhi);
        supportStrength += elementStrength[element] * wangXiangXiuQiuSi[state];
    });
    
    // 计算泄耗阵营力量
    weakenElements.forEach(element => {
        const state = calculateElementState(element, monthZhi);
        weakenStrength += elementStrength[element] * wangXiangXiuQiuSi[state];
    });
    
    // 确定喜用神和忌用神
    const favorable = supportStrength < weakenStrength ? Array.from(supportElements) : Array.from(weakenElements);
    const unfavorable = supportStrength < weakenStrength ? Array.from(weakenElements) : Array.from(supportElements);
    
    return {
        favorable,
        unfavorable
    };
}

// 更新显示结果
function updateDisplay(result) {
    try {
        document.getElementById('solarDate').textContent = result.solarDate;
        document.getElementById('lunarDate').textContent = result.lunarDate;
        document.getElementById('yearGan').textContent = result.yearGan;
        document.getElementById('yearZhi').textContent = result.yearZhi;
        document.getElementById('monthGan').textContent = result.monthGan;
        document.getElementById('monthZhi').textContent = result.monthZhi;
        document.getElementById('dayGan').textContent = result.dayGan;
        document.getElementById('dayZhi').textContent = result.dayZhi;
        document.getElementById('hourGan').textContent = result.hourGan;
        document.getElementById('hourZhi').textContent = result.hourZhi;
        document.getElementById('dayMaster').textContent = result.dayGan;
        
        // 计算五行
        const fiveElements = {
            '甲': '木', '乙': '木',
            '丙': '火', '丁': '火',
            '戊': '土', '己': '土',
            '庚': '金', '辛': '金',
            '壬': '水', '癸': '水'
        };
        const elements = [
            fiveElements[result.yearGan],
            fiveElements[result.monthGan],
            fiveElements[result.dayGan],
            fiveElements[result.hourGan]
        ];
        document.getElementById('fiveElements').textContent = elements.join(' ');
    } catch (error) {
        console.error('更新显示结果时出错:', error);
        throw new Error('更新显示结果失败，请刷新页面重试');
    }
}

// 获取DOM元素
const elements = {
    dateForm: document.getElementById('dateForm'),
    birthdate: document.getElementById('birthdate'),
    birthtime: document.getElementById('birthtime'),
    gender: document.getElementById('gender'),
    address: document.getElementById('address'),
    solarDate: document.getElementById('solarDate'),
    lunarDate: document.getElementById('lunarDate'),
    yearGan: document.getElementById('yearGan'),
    yearZhi: document.getElementById('yearZhi'),
    monthGan: document.getElementById('monthGan'),
    monthZhi: document.getElementById('monthZhi'),
    dayGan: document.getElementById('dayGan'),
    dayZhi: document.getElementById('dayZhi'),
    hourGan: document.getElementById('hourGan'),
    hourZhi: document.getElementById('hourZhi'),
    dayMaster: document.getElementById('dayMaster'),
    fiveElements: document.getElementById('fiveElements'),
    resultSection: document.getElementById('resultSection')
};

// 验证所有必需的DOM元素是否存在
Object.entries(elements).forEach(([key, element]) => {
    if (!element) {
        console.error(`找不到必需的DOM元素: ${key}`);
    }
});

// 五行对应关系
const wuXingMap = {
    '甲': '木', '乙': '木',
    '丙': '火', '丁': '火',
    '戊': '土', '己': '土',
    '庚': '金', '辛': '金',
    '壬': '水', '癸': '水',
    '子': '水', '丑': '土',
    '寅': '木', '卯': '木',
    '辰': '土', '巳': '火',
    '午': '火', '未': '土',
    '申': '金', '酉': '金',
    '戌': '土', '亥': '水'
};

// 地支藏干对应关系
const zhiCangGan = {
    '子': ['癸'],
    '丑': ['己', '辛', '癸'],
    '寅': ['甲', '丙', '戊'],
    '卯': ['乙'],
    '辰': ['戊', '乙', '癸'],
    '巳': ['丙', '戊', '庚'],
    '午': ['丁', '己'],
    '未': ['己', '丁', '乙'],
    '申': ['庚', '壬', '戊'],
    '酉': ['辛'],
    '戌': ['戊', '辛', '丁'],
    '亥': ['壬', '甲']
};

// 计算五行力量
function calculateWuXingStrength(lunar) {
    try {
        const elements = {
            '木': 0, '火': 0, '土': 0, '金': 0, '水': 0
        };
        
        // 计算天干五行
        elements[wuXingMap[lunar.getYearGan()]]++;
        elements[wuXingMap[lunar.getMonthGan()]]++;
        elements[wuXingMap[lunar.getDayGan()]]++;
        elements[wuXingMap[lunar.getTimeGan()]]++;
        
        // 计算地支藏干五行
        const yearZhiGan = zhiCangGan[lunar.getYearZhi()];
        const monthZhiGan = zhiCangGan[lunar.getMonthZhi()];
        const dayZhiGan = zhiCangGan[lunar.getDayZhi()];
        const hourZhiGan = zhiCangGan[lunar.getTimeZhi()];
        
        [yearZhiGan, monthZhiGan, dayZhiGan, hourZhiGan].forEach(gans => {
            gans.forEach(gan => {
                elements[wuXingMap[gan]] += 0.3; // 藏干力量较弱
            });
        });
        
        return elements;
    } catch (error) {
        console.error("计算五行力量时出错:", error);
        return null;
    }
}

// 格式化五行力量显示
function formatWuXingStrength(elements) {
    try {
        return Object.entries(elements)
            .map(([element, strength]) => `${element}:${strength.toFixed(1)}`)
            .join(' ');
    } catch (error) {
        console.error("格式化五行力量时出错:", error);
        return "计算错误";
    }
}

// 添加输入验证
function validateInput(input) {
    const value = parseInt(input.value);
    const min = parseInt(input.min);
    const max = parseInt(input.max);
    
    if (value < min) input.value = min;
    if (value > max) input.value = max;
}

// 为所有数字输入添加验证
document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('change', () => validateInput(input));
});

// 执行排盘
function performBaZiCalculation() {
    const birthdate = elements.birthdate.value;
    const birthtime = elements.birthtime.value;
    const gender = elements.gender.value;
    const address = elements.address.value;

    try {
        const date = new Date(birthdate);
        const bazi = calculateBaZi(date, parseInt(birthtime));
        displayResults(bazi, {
            gender: gender,
            address: address
        });
    } catch (error) {
        console.error('排盘计算错误:', error);
    }
}

// 检查所有必填字段是否已填写
function checkAllFieldsFilled() {
    return elements.birthdate.value && 
           elements.birthtime.value && 
           elements.gender.value && 
           elements.address.value;
}

// 检查并提交表单
function checkAndSubmit() {
    if (checkAllFieldsFilled()) {
        performBaZiCalculation();
    }
}

// 初始化应用
function initApp() {
    // 初始化日期选择器
    initDatePicker();

    // 为所有输入字段添加失去焦点事件
    const inputFields = ['birthdate', 'birthtime', 'gender', 'address'];
    inputFields.forEach(fieldId => {
        const element = elements[fieldId];
        if (element) {
            element.addEventListener('blur', checkAndSubmit);
            element.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    checkAndSubmit();
                }
            });
        }
    });

    // 确保所有依赖加载完成后再执行初始排盘
    if (typeof Lunar !== 'undefined' && typeof flatpickr !== 'undefined') {
        // 延迟执行初始排盘，确保所有DOM元素都已加载
        setTimeout(() => {
            if (checkAllFieldsFilled()) {
                performBaZiCalculation();
            }
        }, 500);
    } else {
        console.error('必要的依赖未加载完成');
    }
}

// 当页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);

function displayResults(bazi, additionalInfo) {
    if (!elements.resultSection) {
        console.error('找不到结果区域元素');
        return;
    }

    elements.resultSection.style.display = 'block';

    // 更新日期信息
    if (elements.solarDate) elements.solarDate.textContent = bazi.solarDate;
    if (elements.lunarDate) elements.lunarDate.textContent = bazi.lunarDate;

    // 更新八字信息
    if (elements.yearGan) elements.yearGan.textContent = bazi.yearGan;
    if (elements.yearZhi) elements.yearZhi.textContent = bazi.yearZhi;
    if (elements.monthGan) elements.monthGan.textContent = bazi.monthGan;
    if (elements.monthZhi) elements.monthZhi.textContent = bazi.monthZhi;
    if (elements.dayGan) elements.dayGan.textContent = bazi.dayGan;
    if (elements.dayZhi) elements.dayZhi.textContent = bazi.dayZhi;
    if (elements.hourGan) elements.hourGan.textContent = bazi.hourGan;
    if (elements.hourZhi) elements.hourZhi.textContent = bazi.hourZhi;

    // 更新日主
    if (elements.dayMaster) {
        elements.dayMaster.textContent = bazi.dayGan;
        // 添加日主样式
        const dayMasterCell = document.querySelector('.bazi-cell.day-master');
        if (dayMasterCell) {
            dayMasterCell.textContent = bazi.dayGan;
        }
    }

    // 更新五行
    if (elements.fiveElements) {
        const ganElements = [
            wuXingMap[bazi.yearGan],
            wuXingMap[bazi.monthGan],
            wuXingMap[bazi.dayGan],
            wuXingMap[bazi.hourGan]
        ];
        
        const zhiElements = [
            wuXingMap[bazi.yearZhi],
            wuXingMap[bazi.monthZhi],
            wuXingMap[bazi.dayZhi],
            wuXingMap[bazi.hourZhi]
        ];
        
        elements.fiveElements.innerHTML = `<strong>天干五行</strong>：${ganElements.join(' ')}<br><strong>地支五行</strong>：${zhiElements.join(' ')}`;
    }

    // 计算并显示喜用神和忌用神
    const { favorable, unfavorable } = calculateFavorableElements(bazi);
    const favorableElements = document.getElementById('favorableElements');
    const unfavorableElements = document.getElementById('unfavorableElements');
    
    if (favorableElements) {
        favorableElements.textContent = favorable.join(' ');
    }
    if (unfavorableElements) {
        unfavorableElements.textContent = unfavorable.join(' ');
    }

    // 更新性别和地址信息
    const genderText = additionalInfo.gender === 'male' ? '男' : '女';
    const genderInfo = document.getElementById('genderInfo');
    const addressInfo = document.getElementById('addressInfo');
    
    if (genderInfo) genderInfo.textContent = genderText;
    if (addressInfo) addressInfo.textContent = additionalInfo.address;

    // 更新太岁信息
    updateTaiSuiInfo(bazi);

    // 只有在所有输入都完成时才滚动到结果区域
    if (checkAllFieldsFilled()) {
        elements.resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    // 准备发送给 DeepSeek 的数据
    const baziData = {
        solarDate: document.getElementById('solarDate').textContent,
        lunarDate: document.getElementById('lunarDate').textContent,
        gender: document.getElementById('genderInfo').textContent,
        yearGan: document.getElementById('yearGan').textContent,
        yearZhi: document.getElementById('yearZhi').textContent,
        monthGan: document.getElementById('monthGan').textContent,
        monthZhi: document.getElementById('monthZhi').textContent,
        dayGan: document.getElementById('dayGan').textContent,
        dayZhi: document.getElementById('dayZhi').textContent,
        hourGan: document.getElementById('hourGan').textContent,
        hourZhi: document.getElementById('hourZhi').textContent,
        dayMaster: document.getElementById('dayMaster').textContent,
        fiveElements: document.getElementById('fiveElements').textContent,
        favorableElements: document.getElementById('favorableElements').textContent,
        unfavorableElements: document.getElementById('unfavorableElements').textContent
    };

    // 调用 DeepSeek 分析
    analyzeWithDeepSeek(baziData, additionalInfo.gender, additionalInfo.address);
}

// 获取地理位置功能
document.getElementById('getLocation').addEventListener('click', function() {
    // 显示加载状态
    this.style.pointerEvents = 'none';
    this.style.opacity = '0.5';
    
    // 使用高德地图定位服务
    AMap.plugin('AMap.Geolocation', function() {
        const geolocation = new AMap.Geolocation({
            enableHighAccuracy: true,  // 是否使用高精度定位，默认:true
            timeout: 10000,           // 超过10秒后停止定位，默认：无穷大
            buttonPosition: 'RB',     // 定位按钮停靠位置
            buttonOffset: new AMap.Pixel(10, 20), // 定位按钮与设置的停靠位置的偏移量，默认：10px
            zoomToAccuracy: true      // 定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
        });

        geolocation.getCurrentPosition(function(status, result) {
            if (status === 'complete') {
                // 定位成功
                const address = result.formattedAddress;
                document.getElementById('address').value = address;
            } else {
                // 定位失败
                console.error('获取位置信息失败:', result);
                alert('获取位置信息失败，请手动输入地址');
            }
            
            // 恢复按钮状态
            document.getElementById('getLocation').style.pointerEvents = 'auto';
            document.getElementById('getLocation').style.opacity = '1';
        });
    });
});

// 添加缓存对象
const taiSuiCache = {
    year: new Map(),
    month: new Map(),
    day: new Map()
};

function getTaiSui(year) {
    // 检查缓存
    const cacheKey = year.toString();
    if (taiSuiCache.year.has(cacheKey)) {
        return taiSuiCache.year.get(cacheKey);
    }
    
    // 使用农历年份计算太岁
    let lunar;
    if (year === 2025) {
        lunar = Lunar.fromDate(new Date(2025, 1, 10));
    } else {
        lunar = Lunar.fromDate(new Date(year, 0, 1));
    }
    
    const yearGan = lunar.getYearGan();
    const yearZhi = lunar.getYearZhi();
    
    // 组合天干地支
    const yearGanZhi = yearGan + yearZhi;
    
    // 太岁对应表（根据天干地支组合）
    const taiSuiMap = {
        '甲子': { name: '金辨将军', direction: '正北', animal: '鼠' },
        '丙子': { name: '陈材将军', direction: '正北', animal: '鼠' },
        '乙丑': { name: '陈素将军', direction: '东北', animal: '牛' },
        '丁丑': { name: '林旺将军', direction: '东北', animal: '牛' },
        '甲寅': { name: '耿章将军', direction: '东北', animal: '虎' },
        '丙寅': { name: '鲁先将军', direction: '东北', animal: '虎' },
        '乙卯': { name: '皮时将军', direction: '正东', animal: '兔' },
        '丁卯': { name: '沈兴将军', direction: '正东', animal: '兔' },
        '甲辰': { name: '李诚将军', direction: '东南', animal: '龙' },
        '丙辰': { name: '赵达将军', direction: '东南', animal: '龙' },
        '乙巳': { name: '吴遂将军', direction: '东南', animal: '蛇' },
        '丁巳': { name: '杨彦将军', direction: '东南', animal: '蛇' },
        '甲午': { name: '文哲将军', direction: '正南', animal: '马' },
        '丙午': { name: '康杰将军', direction: '正南', animal: '马' },
        '乙未': { name: '缪丙将军', direction: '西南', animal: '羊' },
        '丁未': { name: '傅党将军', direction: '西南', animal: '羊' },
        '甲申': { name: '管仲将军', direction: '西南', animal: '猴' },
        '丙申': { name: '毛梓将军', direction: '西南', animal: '猴' },
        '乙酉': { name: '唐杰将军', direction: '正西', animal: '鸡' },
        '丁酉': { name: '康志将军', direction: '正西', animal: '鸡' },
        '甲戌': { name: '施广将军', direction: '西北', animal: '狗' },
        '丙戌': { name: '姜武将军', direction: '西北', animal: '狗' },
        '乙亥': { name: '任保将军', direction: '西北', animal: '猪' },
        '丁亥': { name: '程宝将军', direction: '西北', animal: '猪' }
    };
    
    const taiSui = taiSuiMap[yearGanZhi] || { name: '未知', direction: '未知', animal: '未知' };
    
    // 存入缓存
    taiSuiCache.year.set(cacheKey, taiSui);
    
    return taiSui;
}

function getMonthTaiSui(month, yearTaiSui) {
    const cacheKey = `${month}-${yearTaiSui.animal}`;
    if (taiSuiCache.month.has(cacheKey)) {
        return taiSuiCache.month.get(cacheKey);
    }
    
    const lunar = Lunar.fromDate(new Date());
    const monthZhi = lunar.getMonthZhi();
    
    if (!monthZhi) return { name: '未知', direction: '未知', conflicts: [] };
    
    const yearTaiSuiZhi = yearTaiSui.animal;
    
    const directionMap = {
        '子': '正北', '丑': '东北', '寅': '东北',
        '卯': '正东', '辰': '东南', '巳': '东南',
        '午': '正南', '未': '西南', '申': '西南',
        '酉': '正西', '戌': '西北', '亥': '西北'
    };
    
    const conflicts = [];
    
    if (zhiRelations['刑'][monthZhi]?.includes(yearTaiSuiZhi)) {
        conflicts.push('刑太岁');
    }
    if (zhiRelations['冲'][monthZhi]?.includes(yearTaiSuiZhi)) {
        conflicts.push('冲太岁');
    }
    if (zhiRelations['破'][monthZhi]?.includes(yearTaiSuiZhi)) {
        conflicts.push('破太岁');
    }
    if (zhiRelations['害'][monthZhi]?.includes(yearTaiSuiZhi)) {
        conflicts.push('害太岁');
    }
    if (monthZhi === yearTaiSuiZhi) {
        conflicts.push('值太岁');
    }
    
    const result = {
        name: monthZhi,
        direction: directionMap[monthZhi],
        conflicts: conflicts
    };
    
    taiSuiCache.month.set(cacheKey, result);
    return result;
}

function getDayTaiSui(day) {
    const cacheKey = day.toString();
    if (taiSuiCache.day.has(cacheKey)) {
        return taiSuiCache.day.get(cacheKey);
    }
    
    const lunar = Lunar.fromDate(new Date());
    const dayZhi = lunar.getDayZhi();
    
    if (!dayZhi) return { name: '未知', direction: '未知', conflicts: [] };
    
    const yearTaiSuiZhi = '巳'; // 2025年的年太岁地支
    
    const conflicts = [];
    
    if (zhiRelations['刑'][dayZhi]?.includes(yearTaiSuiZhi)) {
        conflicts.push('刑太岁');
    }
    if (zhiRelations['冲'][dayZhi]?.includes(yearTaiSuiZhi)) {
        conflicts.push('冲太岁');
    }
    if (zhiRelations['破'][dayZhi]?.includes(yearTaiSuiZhi)) {
        conflicts.push('破太岁');
    }
    if (zhiRelations['害'][dayZhi]?.includes(yearTaiSuiZhi)) {
        conflicts.push('害太岁');
    }
    if (dayZhi === yearTaiSuiZhi) {
        conflicts.push('值太岁');
    }
    
    const directionMap = {
        '子': '正北', '丑': '东北', '寅': '东北',
        '卯': '正东', '辰': '东南', '巳': '东南',
        '午': '正南', '未': '西南', '申': '西南',
        '酉': '正西', '戌': '西北', '亥': '西北'
    };
    
    const result = {
        name: dayZhi,
        direction: directionMap[dayZhi],
        conflicts: conflicts
    };
    
    taiSuiCache.day.set(cacheKey, result);
    return result;
}

// 添加地支关系判断
const zhiRelations = {
    // 刑
    '刑': {
        '子': ['卯'], '卯': ['子'],
        '寅': ['巳', '申'], '巳': ['寅', '申'], '申': ['寅', '巳'],
        '辰': ['辰'], '午': ['午'],
        '未': ['未'], '酉': ['酉'],
        '戌': ['戌'], '亥': ['亥']
    },
    // 冲
    '冲': {
        '子': ['午'], '午': ['子'],
        '丑': ['未'], '未': ['丑'],
        '寅': ['申'], '申': ['寅'],
        '卯': ['酉'], '酉': ['卯'],
        '辰': ['戌'], '戌': ['辰'],
        '巳': ['亥'], '亥': ['巳']
    },
    // 破
    '破': {
        '子': ['酉'], '酉': ['子'],
        '丑': ['戌'], '戌': ['丑'],
        '寅': ['亥'], '亥': ['寅'],
        '卯': ['子'], '子': ['卯'],
        '辰': ['丑'], '丑': ['辰'],
        '巳': ['申'], '申': ['巳'],
        '午': ['卯'], '卯': ['午'],
        '未': ['辰'], '辰': ['未'],
        '酉': ['午'], '午': ['酉'],
        '戌': ['未'], '未': ['戌'],
        '亥': ['申'], '申': ['亥']
    },
    // 害
    '害': {
        '子': ['未'], '未': ['子'],
        '丑': ['午'], '午': ['丑'],
        '寅': ['巳'], '巳': ['寅'],
        '卯': ['辰'], '辰': ['卯'],
        '申': ['亥'], '亥': ['申'],
        '酉': ['戌'], '戌': ['酉']
    }
};

function checkTaiSuiConflict(taiSui, zhi) {
    // 检查是否犯太岁
    const conflictMap = {
        '子': ['午'], '丑': ['未'], '寅': ['申'],
        '卯': ['酉'], '辰': ['戌'], '巳': ['亥'],
        '午': ['子'], '未': ['丑'], '申': ['寅'],
        '酉': ['卯'], '戌': ['辰'], '亥': ['巳']
    };
    
    // 提取地支
    const taiSuiZhi = taiSui.name.slice(-1);
    return conflictMap[taiSuiZhi]?.includes(zhi) || false;
}

function updateTaiSuiInfo(bazi) {
    // 获取当前时间的太岁
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentLunar = Lunar.fromDate(now);
    
    // 获取当前年份的天干地支
    const currentYearGan = currentLunar.getYearGan();
    const currentYearZhi = currentLunar.getYearZhi();
    const currentMonthGan = currentLunar.getMonthGan();
    const currentMonthZhi = currentLunar.getMonthZhi();
    const currentDayGan = currentLunar.getDayGan();
    const currentDayZhi = currentLunar.getDayZhi();
    
    // 获取当前时间的太岁
    const currentYearTaiSui = getTaiSui(currentYear);
    const currentMonthTaiSui = getMonthTaiSui(now.getMonth() + 1, currentYearTaiSui);
    const currentDayTaiSui = getDayTaiSui(now.getDate());
    
    // 更新当前时间太岁信息
    const currentYearElement = document.getElementById('currentYearTaiSui');
    const currentMonthElement = document.getElementById('currentMonthTaiSui');
    const currentDayElement = document.getElementById('currentDayTaiSui');
    
    // 更新年太岁显示，显示当前年份天干地支和值年太岁
    currentYearElement.textContent = `${currentYearGan}${currentYearZhi} ${currentYearTaiSui.name}`;
    
    // 更新月太岁显示，显示当前月份天干地支
    currentMonthElement.textContent = `${currentMonthGan}${currentMonthZhi}`;
    
    // 更新日太岁显示，显示当前日期天干地支
    currentDayElement.textContent = `${currentDayGan}${currentDayZhi}`;
    
    // 更新出生时间太岁信息
    const birthYearElement = document.getElementById('birthYearTaiSui');
    const birthMonthElement = document.getElementById('birthMonthTaiSui');
    const birthDayElement = document.getElementById('birthDayTaiSui');
    
    // 检查出生年太岁冲突（与当前年份天干地支比较）
    const birthYearConflicts = [];
    
    // 检查值太岁
    if (bazi.yearZhi === currentYearZhi) {
        birthYearConflicts.push('值太岁');
    }
    
    // 检查刑太岁
    if (zhiRelations['刑'][bazi.yearZhi]?.includes(currentYearZhi)) {
        birthYearConflicts.push('刑太岁');
    }
    
    // 检查冲太岁
    if (zhiRelations['冲'][bazi.yearZhi]?.includes(currentYearZhi)) {
        birthYearConflicts.push('冲太岁');
    }
    
    // 检查破太岁
    if (zhiRelations['破'][bazi.yearZhi]?.includes(currentYearZhi)) {
        birthYearConflicts.push('破太岁');
    }
    
    // 检查害太岁
    if (zhiRelations['害'][bazi.yearZhi]?.includes(currentYearZhi)) {
        birthYearConflicts.push('害太岁');
    }
    
    // 更新出生年太岁显示
    let birthYearText = '';
    if (birthYearConflicts.length > 0) {
        birthYearText = birthYearConflicts.join('、');
        birthYearElement.classList.add('conflict');
    } else {
        birthYearElement.classList.remove('conflict');
        birthYearText = '不犯太岁';
    }
    birthYearElement.textContent = birthYearText;
    
    // 检查出生月太岁冲突（与当前年份天干地支比较）
    const birthMonthConflicts = [];
    if (bazi.monthZhi === currentYearZhi) {
        birthMonthConflicts.push('值太岁');
    }
    if (zhiRelations['刑'][bazi.monthZhi]?.includes(currentYearZhi)) {
        birthMonthConflicts.push('刑太岁');
    }
    if (zhiRelations['冲'][bazi.monthZhi]?.includes(currentYearZhi)) {
        birthMonthConflicts.push('冲太岁');
    }
    if (zhiRelations['破'][bazi.monthZhi]?.includes(currentYearZhi)) {
        birthMonthConflicts.push('破太岁');
    }
    if (zhiRelations['害'][bazi.monthZhi]?.includes(currentYearZhi)) {
        birthMonthConflicts.push('害太岁');
    }
    
    // 更新出生月太岁显示
    let birthMonthText = '';
    if (birthMonthConflicts.length > 0) {
        birthMonthText = birthMonthConflicts.join('、');
        birthMonthElement.classList.add('conflict');
    } else {
        birthMonthElement.classList.remove('conflict');
        birthMonthText = '不犯太岁';
    }
    birthMonthElement.textContent = birthMonthText;

    // 检查出生日太岁冲突（与当前年份天干地支比较）
    const birthDayConflicts = [];
    if (bazi.dayZhi === currentYearZhi) {
        birthDayConflicts.push('值太岁');
    }
    if (zhiRelations['刑'][bazi.dayZhi]?.includes(currentYearZhi)) {
        birthDayConflicts.push('刑太岁');
    }
    if (zhiRelations['冲'][bazi.dayZhi]?.includes(currentYearZhi)) {
        birthDayConflicts.push('冲太岁');
    }
    if (zhiRelations['破'][bazi.dayZhi]?.includes(currentYearZhi)) {
        birthDayConflicts.push('破太岁');
    }
    if (zhiRelations['害'][bazi.dayZhi]?.includes(currentYearZhi)) {
        birthDayConflicts.push('害太岁');
    }
    
    // 更新出生日太岁显示
    let birthDayText = '';
    if (birthDayConflicts.length > 0) {
        birthDayText = birthDayConflicts.join('、');
        birthDayElement.classList.add('conflict');
    } else {
        birthDayElement.classList.remove('conflict');
        birthDayText = '不犯太岁';
    }
    birthDayElement.textContent = birthDayText;

    // 在控制台输出详细信息以便调试
    console.log('出生时间天干地支:', {
        年柱: `${bazi.yearGan}${bazi.yearZhi}`,
        月柱: `${bazi.monthGan}${bazi.monthZhi}`,
        日柱: `${bazi.dayGan}${bazi.dayZhi}`,
        时柱: `${bazi.hourGan}${bazi.hourZhi}`,
        年柱太岁冲突: birthYearConflicts,
        当前年太岁: currentYearZhi
    });
}

// 添加 DeepSeek API 调用函数
async function analyzeWithDeepSeek(baziData, gender, address) {
    const deepseekSection = document.getElementById('deepseekSection');
    const deepseekLoading = document.getElementById('deepseekLoading');
    const deepseekResult = document.getElementById('deepseekResult');
    
    // 显示分析区域和加载动画
    deepseekSection.style.display = 'block';
    deepseekLoading.style.display = 'block';
    deepseekResult.innerHTML = '';
    
    try {
        console.log('准备发送分析请求:', { baziData, gender, address });
        
        const response = await fetch('https://digital-bazi.vercel.app/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                bazi: baziData,
                gender: gender,
                address: address
            })
        });
        
        console.log('收到服务器响应:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.error && errorData.error.includes('Insufficient Balance')) {
                throw new Error('AI 分析服务暂时不可用（账户余额不足），请联系管理员充值。');
            }
            throw new Error(errorData.error || `分析请求失败，请稍后重试 (${response.status} ${response.statusText})`);
        }
        
        const data = await response.json();
        console.log('分析结果:', data);
        
        // 格式化分析结果
        const formattedResult = `
            <div class="analysis-section">
                <h3>性格：</h3>
                <p>${data.personality || '暂无分析'}</p>
                
                <h3>财运：</h3>
                <p>${data.wealth || '暂无分析'}</p>
                
                <h3>事业运：</h3>
                <p>${data.career || '暂无分析'}</p>
                
                <h3>健康运：</h3>
                <p>${data.health || '暂无分析'}</p>
                
                <h3>婚姻生活：</h3>
                <p>${data.marriage || '暂无分析'}</p>
            </div>
        `;
        
        deepseekResult.innerHTML = formattedResult;
    } catch (error) {
        console.error('分析出错:', error);
        deepseekResult.innerHTML = `
            <div class="error-message">
                <h3>分析过程中出现错误</h3>
                <p>${error.message}</p>
                <p>请确保：</p>
                <ul>
                    <li>网络连接正常</li>
                    <li>AI 服务账户余额充足</li>
                </ul>
            </div>
        `;
    } finally {
        deepseekLoading.style.display = 'none';
    }
}

// 修改表单提交处理函数
document.getElementById('dateForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // ... 现有的八字计算代码 ...
    
    // 在显示结果后调用 DeepSeek 分析
    const gender = document.getElementById('gender').value;
    const address = document.getElementById('address').value;
    await analyzeWithDeepSeek(bazi, gender, address);
}); 