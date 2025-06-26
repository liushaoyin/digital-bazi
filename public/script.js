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

        // 创建公历年份选项
        const currentYear = new Date().getFullYear();
        const yearOptions = Array.from({length: 100}, (_, i) => currentYear - i);
        
        // 创建公历月份选项
        const monthOptions = Array.from({length: 12}, (_, i) => i + 1);
        
        // 创建公历日期选项（默认31天）
        const dayOptions = Array.from({length: 31}, (_, i) => i + 1);

        // 创建自定义输入框
        const customInput = document.createElement('div');
        customInput.className = 'solar-date-picker';
        customInput.innerHTML = `
            <select class="solar-year" id="solarYear" name="solarYear"></select>
            <span>年</span>
            <select class="solar-month" id="solarMonth" name="solarMonth"></select>
            <span>月</span>
            <select class="solar-day" id="solarDay" name="solarDay"></select>
            <span>日</span>
        `;

        // 填充选项
        const yearSelect = customInput.querySelector('.solar-year');
        const monthSelect = customInput.querySelector('.solar-month');
        const daySelect = customInput.querySelector('.solar-day');

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

        // 设置初始值为当前日期
        const today = new Date();
        yearSelect.value = today.getFullYear();
        monthSelect.value = today.getMonth() + 1;
        updateDayOptions();
        daySelect.value = today.getDate();

        // 替换原始输入框
        birthdateInput.style.display = 'none';
        birthdateInput.parentNode.insertBefore(customInput, birthdateInput);

        // 更新日期选项的函数
        function updateDayOptions() {
            const year = parseInt(yearSelect.value);
            const month = parseInt(monthSelect.value);
            const daysInMonth = new Date(year, month, 0).getDate();
            
            // 清空现有选项
            daySelect.innerHTML = '';
            
            // 添加新的日期选项
            for (let day = 1; day <= daysInMonth; day++) {
                const option = document.createElement('option');
                option.value = day;
                option.textContent = day;
                daySelect.appendChild(option);
            }
        }

        // 添加事件监听器
        yearSelect.addEventListener('change', function() {
            updateDayOptions();
            // 若当前日大于新月份最大天数，自动选中最大天数
            if (parseInt(daySelect.value) > daySelect.options.length) {
                daySelect.value = daySelect.options.length;
            }
            updateBirthdateValue();
        });

        monthSelect.addEventListener('change', function() {
            updateDayOptions();
            if (parseInt(daySelect.value) > daySelect.options.length) {
                daySelect.value = daySelect.options.length;
            }
            updateBirthdateValue();
        });

        daySelect.addEventListener('change', updateBirthdateValue);

        // 更新隐藏输入框的值
        function updateBirthdateValue() {
            const year = yearSelect.value;
            const month = String(monthSelect.value).padStart(2, '0');
            const day = String(daySelect.value).padStart(2, '0');
            birthdateInput.value = `${year}-${month}-${day}`;
            checkAndSubmit();
        }

        // 初始化日期选项
        updateDayOptions();
        // 同步初始值到隐藏输入框
        updateBirthdateValue();
    }

    // 初始化农历日期选择器
    function initLunarDatePicker() {
        if (flatpickrInstance) {
            flatpickrInstance.destroy();
        }

        // 隐藏公历日期选择器
        const solarPicker = document.querySelector('.solar-date-picker');
        if (solarPicker) {
            solarPicker.remove();
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
                // 隐藏农历日期选择器
                const lunarPicker = document.querySelector('.lunar-date-picker');
                if (lunarPicker) {
                    lunarPicker.remove();
                }
                birthdateInput.style.display = 'block';
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
function calculateBaZi(date, hour, dateType, gender) {
    let lunar;
    if (dateType === 'lunar') {
        const [year, month, day] = [date.getFullYear(), date.getMonth() + 1, date.getDate()];
        lunar = Lunar.fromYmd(year, month, day);
    } else {
        lunar = Solar.fromDate(date).getLunar();
    }

    const bazi = {
        yearGan: lunar.getYearGan(),
        yearZhi: lunar.getYearZhi(),
        monthGan: lunar.getMonthGan(),
        monthZhi: lunar.getMonthZhi(),
        dayGan: lunar.getDayGan(),
        dayZhi: lunar.getDayZhi(),
        hourGan: lunar.getTimeGan(),
        hourZhi: lunar.getTimeZhi()
    };

    const additionalInfo = {
        solarDate: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        lunarDate: lunar.toString(),
        gender,
        dateType
    };

    return { bazi, additionalInfo };
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
    // 获取出生时辰文本
    const birthtimeSelect = document.getElementById('birthtime');
    const birthtimeText = birthtimeSelect.options[birthtimeSelect.selectedIndex].text;

    // 公历
    document.getElementById('solarDate').textContent = result.solarDate + ' ' + birthtimeText;
    // 农历
    document.getElementById('lunarDate').textContent = result.lunarDate + ' ' + birthtimeText;

    // 更新性别信息
    const gender = document.getElementById('gender').value;
    document.getElementById('genderInfo').textContent = gender === 'male' ? '男' : '女';

    // 更新地址信息
    const address = document.getElementById('address').value;
    document.getElementById('addressInfo').textContent = address;

    // 更新八字信息
    document.getElementById('yearGan').textContent = result.yearGan;
    document.getElementById('yearZhi').textContent = result.yearZhi;
    document.getElementById('monthGan').textContent = result.monthGan;
    document.getElementById('monthZhi').textContent = result.monthZhi;
    document.getElementById('dayGan').textContent = result.dayGan;
    document.getElementById('dayZhi').textContent = result.dayZhi;
    document.getElementById('hourGan').textContent = result.hourGan;
    document.getElementById('hourZhi').textContent = result.hourZhi;

    // 更新日主信息
    document.getElementById('dayMaster').textContent = result.dayGan;

    // 更新五行信息
    const wuxingStrength = calculateWuXingStrength(result);
    document.getElementById('fiveElements').textContent = formatWuXingStrength(wuxingStrength);

    // 更新喜用神和忌用神
    const favorableElements = calculateFavorableElements(result);
    document.getElementById('favorableElements').textContent = favorableElements.favorable.join('、');
    document.getElementById('unfavorableElements').textContent = favorableElements.unfavorable.join('、');

    // 显示结果区域
    document.getElementById('resultSection').style.display = 'block';
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
    if (!checkAllFieldsFilled()) {
        showToast('请填写所有必填信息', 'error');
        return null;
    }

    const dateType = document.querySelector('input[name="dateType"]:checked').value;
    const birthdate = document.getElementById('birthdate').value;
    const birthtime = parseInt(document.getElementById('birthtime').value, 10);
    const gender = document.getElementById('gender').value;

    if (!birthdate || isNaN(birthtime) || !gender) {
        showToast('请确保所有信息都已正确填写。', 'error');
        return null;
    }

    try {
        const dateParts = birthdate.split('-').map(p => parseInt(p, 10));
        const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

        const { bazi, additionalInfo } = calculateBaZi(date, birthtime, dateType, gender);

        return { bazi, additionalInfo };

    } catch (error) {
        console.error('八字计算出错:', error);
        showToast(`计算失败: ${error.message}`, 'error');
        return null;
    }
}

function checkAllFieldsFilled() {
    const birthdate = document.getElementById('birthdate').value;
    const birthtime = document.getElementById('birthtime').value;
    const gender = document.getElementById('gender').value;
    const address = document.getElementById('address').value;

    return birthdate && birthtime && gender && address;
}

// 地址历史记录相关函数
function saveAddressToHistory(address) {
    if (!address) return;
    
    // 获取现有历史记录
    let addressHistory = JSON.parse(localStorage.getItem('addressHistory') || '[]');
    
    // 移除重复的地址
    addressHistory = addressHistory.filter(addr => addr !== address);
    
    // 将新地址添加到开头
    addressHistory.unshift(address);
    
    // 只保留最近的5个地址
    addressHistory = addressHistory.slice(0, 5);
    
    // 保存回 localStorage
    localStorage.setItem('addressHistory', JSON.stringify(addressHistory));
    
    // 更新地址历史显示
    updateAddressHistoryDisplay();
}

function updateAddressHistoryDisplay() {
    const addressInput = document.getElementById('address');
    const addressHistory = JSON.parse(localStorage.getItem('addressHistory') || '[]');
    
    // 移除现有的历史记录容器
    const existingContainer = document.querySelector('.address-history');
    if (existingContainer) {
        existingContainer.remove();
    }

    if (addressHistory.length > 0) {
        const container = createAddressHistoryContainer();
        const title = document.createElement('div');
        title.className = 'address-history-title';
        title.textContent = '之前地址';
        container.appendChild(title);

        addressHistory.forEach(address => {
            const item = document.createElement('div');
            item.className = 'address-history-item';
            item.textContent = address;
            item.addEventListener('click', () => {
                addressInput.value = address;
                // 在移动端，点击后自动收起键盘
                if (document.activeElement === addressInput) {
                    addressInput.blur();
                }
            });
            container.appendChild(item);
        });

        addressInput.parentNode.appendChild(container);
    }
}

function createAddressHistoryContainer() {
    const container = document.createElement('div');
    container.id = 'addressHistory';
    container.className = 'address-history';
    
    // 将容器插入到地址输入框后面
    const addressInput = document.getElementById('address');
    addressInput.parentNode.insertBefore(container, addressInput.nextSibling);
    
    return container;
}

// 修改 checkAndSubmit 函数，添加地址保存逻辑
function checkAndSubmit() {
    if (checkAllFieldsFilled()) {
        const address = document.getElementById('address').value;
        saveAddressToHistory(address); // 保存地址到历史记录
        performBaZiCalculation();
    }
}

// 修改 initApp 函数，添加地址历史记录初始化
function initApp() {
    try {
        checkDependencies();
        initDatePicker();
        
        // 获取当前位置
        const getLocationBtn = document.getElementById('getLocation');
        if (getLocationBtn) {
            getLocationBtn.addEventListener('click', function() {
                const addressInput = document.getElementById('address');
                const getLocationBtn = this;
                
                // 显示加载状态
                getLocationBtn.disabled = true;
                getLocationBtn.innerHTML = '<div class="spinner"></div>';
                getLocationBtn.title = '正在获取位置...';
                
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
                            addressInput.value = address;
                            saveAddressToHistory(address);
                            
                            // 显示成功提示
                            showToast('位置获取成功', 'success');
                        } else {
                            // 定位失败
                            console.error('获取位置信息失败:', result);
                            showToast('获取位置失败，请手动输入地址', 'error');
                        }
                        
                        // 恢复按钮状态
                        getLocationBtn.disabled = false;
                        getLocationBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 5.52 8 12 8 12s8-6.48 8-12a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>';
                        getLocationBtn.title = '获取当前位置';
                    });
                });
            });
        }

        // 添加开始测算按钮事件监听
                // 添加开始测算按钮事件监听
        const calculateBtn = document.getElementById('calculateBtn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', async function() {
                if (this.disabled) return;

                document.activeElement.blur();

                try {
                    this.disabled = true;
                    this.textContent = '测算中...';
                    
                    const result = performBaZiCalculation();
                    
                    if (result) {
                        // 1. 显示八字结果，并获取用于AI分析的数据
                        const baziDataForAI = displayResults(result.bazi, result.additionalInfo);

                        // 2. 调用DeepSeek进行分析
                        await analyzeWithDeepSeek(baziDataForAI);
                    }
                } catch (error) {
                    console.error('An error occurred during calculation:', error);
                    showToast(error.message || '测算时发生未知错误', 'error');
                } finally {
                    this.disabled = false;
                    this.textContent = '开始测算';
                }
            });
        }

        // 修改表单提交事件
        const form = document.getElementById('dateForm');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                if (checkAllFieldsFilled()) {
                    performBaZiCalculation();
                } else {
                    alert('请填写所有必填信息');
                }
            });
        }

        // 添加地址历史记录功能
        const addressInput = document.getElementById('address');
        if (addressInput) {
            addressInput.addEventListener('input', function() {
                updateAddressHistoryDisplay();
            });
        }

        // 初始化地址历史记录显示
        updateAddressHistoryDisplay();

        // 添加触摸反馈
        document.querySelectorAll('button, select, input').forEach(element => {
            element.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
            });
            element.addEventListener('touchend', function() {
                this.style.transform = '';
            });
        });

        // 优化移动端输入体验
        document.querySelectorAll('input, select').forEach(element => {
            element.addEventListener('focus', function() {
                // 滚动到可视区域
                setTimeout(() => {
                    this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
        });

    } catch (error) {
        console.error('初始化应用时出错:', error);
        alert('初始化应用失败，请刷新页面重试');
    }
}

// 当页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);

function displayResults(bazi, additionalInfo) {
    // 此处应包含所有更新页面元素的代码，例如：
    document.getElementById('yearGan').innerText = bazi.yearGan;
    document.getElementById('yearZhi').innerText = bazi.yearZhi;
    // ... 其他八字信息的更新 ...
    
    // 假设以下元素也由这个函数更新
    const { favorable, unfavorable } = calculateFavorableElements(bazi);
    document.getElementById('dayMaster').innerText = bazi.dayGan;
    document.getElementById('fiveElements').innerText = formatWuXingStrength(calculateWuXingStrength(Solar.fromDate(new Date(additionalInfo.solarDate)).getLunar()));
    document.getElementById('favorableElements').innerText = favorable.join(', ');
    document.getElementById('unfavorableElements').innerText = unfavorable.join(', ');

    updateTaiSuiInfo(bazi);

    const resultSection = document.getElementById('resultSection');
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // AI分析所需的数据
    return {
        yearGan: bazi.yearGan,
        yearZhi: bazi.yearZhi,
        monthGan: bazi.monthGan,
        monthZhi: bazi.monthZhi,
        dayGan: bazi.dayGan,
        dayZhi: bazi.dayZhi,
        hourGan: bazi.hourGan,
        hourZhi: bazi.hourZhi,
        dayMaster: document.getElementById('dayMaster').innerText,
        fiveElements: document.getElementById('fiveElements').innerText,
        favorableElements: document.getElementById('favorableElements').innerText,
        unfavorableElements: document.getElementById('unfavorableElements').innerText,
        gender: additionalInfo.gender,
        birthPlace: additionalInfo.address
    };
}

// 获取地理位置功能
document.getElementById('getLocation').addEventListener('click', function() {
    const addressInput = document.getElementById('address');
    const getLocationBtn = this;
    
    // 显示加载状态
    getLocationBtn.disabled = true;
    getLocationBtn.innerHTML = '<div class="spinner"></div>';
    getLocationBtn.title = '正在获取位置...';
    
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
                addressInput.value = address;
                saveAddressToHistory(address);
                
                // 显示成功提示
                showToast('位置获取成功', 'success');
            } else {
                // 定位失败
                console.error('获取位置信息失败:', result);
                showToast('获取位置失败，请手动输入地址', 'error');
            }
            
            // 恢复按钮状态
            getLocationBtn.disabled = false;
            getLocationBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 5.52 8 12 8 12s8-6.48 8-12a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>';
            getLocationBtn.title = '获取当前位置';
        });
    });
});

// 添加地址输入验证和自动完成功能
document.getElementById('address').addEventListener('input', function() {
    const address = this.value.trim();
    if (address.length > 0) {
        // 使用高德地图API进行地址搜索提示
        AMap.plugin('AMap.AutoComplete', function() {
            const autoComplete = new AMap.AutoComplete({
                city: '全国'
            });
            
            autoComplete.search(address, function(status, result) {
                if (status === 'complete' && result.tips) {
                    const tips = result.tips;
                    if (tips.length > 0) {
                        // 显示地址建议
                        showAddressSuggestions(tips);
                    }
                }
            });
        });
    }
});

// 显示地址建议
function showAddressSuggestions(tips) {
    // 移除现有的建议列表
    const existingSuggestions = document.querySelector('.address-suggestions');
    if (existingSuggestions) {
        existingSuggestions.remove();
    }
    
    // 创建建议列表容器
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'address-suggestions';
    
    // 添加建议项
    tips.forEach(tip => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'address-suggestion-item';
        suggestionItem.textContent = tip.name;
        suggestionItem.addEventListener('click', () => {
            document.getElementById('address').value = tip.name;
            suggestionsContainer.remove();
            saveAddressToHistory(tip.name);
        });
        suggestionsContainer.appendChild(suggestionItem);
    });
    
    // 将建议列表添加到地址输入框下方
    document.getElementById('address').parentNode.appendChild(suggestionsContainer);
}

// 显示提示消息
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 2秒后自动移除
    setTimeout(() => {
        toast.classList.add('toast-fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

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
async function analyzeWithDeepSeek(bazi, gender, address) {
    const deepseekSection = document.getElementById('deepseekSection');
    const deepseekLoading = document.getElementById('deepseekLoading');
    const deepseekResult = document.getElementById('deepseekResult');

    // 重置并显示加载状态
    deepseekSection.style.display = 'block';
    deepseekResult.style.display = 'none'; // 先隐藏结果区
    deepseekLoading.style.display = 'flex';

    // 重置各项分析内容
    document.getElementById('analysis-personality').innerText = '正在加载...';
    document.getElementById('analysis-wealth').innerText = '正在加载...';
    document.getElementById('analysis-career').innerText = '正在加载...';
    document.getElementById('analysis-health').innerText = '正在加载...';
    document.getElementById('analysis-marriage').innerText = '正在加载...';

    deepseekSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const baziData = {
        yearGan: bazi.yearGan,
        yearZhi: bazi.yearZhi,
        monthGan: bazi.monthGan,
        monthZhi: bazi.monthZhi,
        dayGan: bazi.dayGan,
        dayZhi: bazi.dayZhi,
        hourGan: bazi.hourGan,
        hourZhi: bazi.hourZhi,
        dayMaster: document.getElementById('dayMaster').innerText,
        fiveElements: document.getElementById('fiveElements').innerText,
        favorableElements: document.getElementById('favorableElements').innerText,
        unfavorableElements: document.getElementById('unfavorableElements').innerText,
        gender: gender,
        birthPlace: address
    };

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(baziData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `服务器响应错误: ${response.status}`);
        }

        const data = await response.json();

        // 诊断日志：打印从服务器收到的原始数据
        console.log('从服务器收到的原始分析数据:', JSON.stringify(data, null, 2));

        // 兼容有或没有 analysis 包装的情况
        const analysis = data.analysis || data;

        if (analysis && typeof analysis === 'object') {
            document.getElementById('analysis-personality').innerText = analysis.personality || '暂无分析';
            document.getElementById('analysis-wealth').innerText = analysis.fortune || analysis.wealth || '暂无分析';
            document.getElementById('analysis-career').innerText = analysis.career || '暂无分析';
            document.getElementById('analysis-health').innerText = analysis.health || '暂无分析';
            document.getElementById('analysis-marriage').innerText = analysis.marriage || analysis.family || '暂无分析';
        } else {
            throw new Error('未能获取到有效的分析结果对象。');
        }

    } catch (error) {
        console.error('DeepSeek分析请求失败:', error);
        // 在所有分析框中显示错误
        const errorMessage = `分析失败: ${error.message}`;
        document.getElementById('analysis-personality').innerText = errorMessage;
        document.getElementById('analysis-wealth').innerText = errorMessage;
        document.getElementById('analysis-career').innerText = errorMessage;
        document.getElementById('analysis-health').innerText = errorMessage;
        document.getElementById('analysis-marriage').innerText = errorMessage;
    } finally {
        // 隐藏加载动画并显示结果
        deepseekLoading.style.display = 'none';
        deepseekResult.style.display = 'grid';
    }
}

// 添加移动端点击事件处理
document.addEventListener('DOMContentLoaded', function() {
    const title = document.querySelector('h1[title]');
    const guideTip = document.querySelector('.guide-tip[title]');

    if (title) {
        title.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    }

    if (guideTip) {
        guideTip.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    }

    // 点击页面其他地方时关闭提示
    document.addEventListener('click', function(event) {
        if (title && !title.contains(event.target)) {
            title.classList.remove('active');
        }
        if (guideTip && !guideTip.contains(event.target)) {
            guideTip.classList.remove('active');
        }
    });
});

// 添加开发者信息提示的点击事件处理
document.addEventListener('DOMContentLoaded', function() {
    const developerInfo = document.querySelector('.developer-info span[title]');
    if (developerInfo) {
        developerInfo.addEventListener('click', function() {
            this.classList.toggle('active');
        });

        // 点击其他区域时关闭提示
        document.addEventListener('click', function(e) {
            if (!developerInfo.contains(e.target)) {
                developerInfo.classList.remove('active');
            }
        });
    }
}); 