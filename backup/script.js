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
function calculateWuXingStrength(bazi) {
    try {
        // 验证输入
        if (!bazi || typeof bazi !== 'object') {
            throw new Error('无效的八字数据');
        }

        // 验证必需的八字属性
        const requiredFields = ['yearGan', 'yearZhi', 'monthGan', 'monthZhi', 'dayGan', 'dayZhi', 'hourGan', 'hourZhi'];
        const missingFields = requiredFields.filter(field => !bazi[field]);
        if (missingFields.length > 0) {
            throw new Error(`八字数据缺少必需字段: ${missingFields.join(', ')}`);
        }

        // 验证天干地支值是否有效
        const validGan = Object.keys(ganValues);
        const validZhi = Object.keys(zhiValues);
        
        const invalidGan = [bazi.yearGan, bazi.monthGan, bazi.dayGan, bazi.hourGan]
            .filter(gan => !validGan.includes(gan));
        const invalidZhi = [bazi.yearZhi, bazi.monthZhi, bazi.dayZhi, bazi.hourZhi]
            .filter(zhi => !validZhi.includes(zhi));

        if (invalidGan.length > 0) {
            throw new Error(`无效的天干值: ${invalidGan.join(', ')}`);
        }
        if (invalidZhi.length > 0) {
            throw new Error(`无效的地支值: ${invalidZhi.join(', ')}`);
        }

        // 计算五行力量
        const elements = {
            '木': 0, '火': 0, '土': 0, '金': 0, '水': 0
        };

        // 计算天干五行力量
        [bazi.yearGan, bazi.monthGan, bazi.dayGan, bazi.hourGan].forEach(gan => {
            const ganInfo = ganValues[gan];
            if (ganInfo && ganInfo.element) {
                elements[ganInfo.element] += ganInfo.value;
            }
        });

        // 计算地支藏干五行力量
        [bazi.yearZhi, bazi.monthZhi, bazi.dayZhi, bazi.hourZhi].forEach(zhi => {
            const zhiInfo = zhiValues[zhi];
            if (zhiInfo) {
                if (zhiInfo.main && zhiInfo.main.element) {
                    elements[zhiInfo.main.element] += zhiInfo.main.value;
                }
                if (zhiInfo.middle && zhiInfo.middle.element) {
                    elements[zhiInfo.middle.element] += zhiInfo.middle.value;
                }
                if (zhiInfo.extra && zhiInfo.extra.element) {
                    elements[zhiInfo.extra.element] += zhiInfo.extra.value;
                }
            }
        });

        // 计算月令状态
        const monthZhi = bazi.monthZhi;
        const monthElement = zhiValues[monthZhi].main.element;

        // 计算各五行状态
        const elementStates = {};
        Object.keys(elements).forEach(element => {
            elementStates[element] = calculateElementState(element, monthZhi);
        });

        // 应用旺相休囚死权重
        Object.keys(elements).forEach(element => {
            const state = elementStates[element];
            elements[element] *= wangXiangXiuQiuSi[state] || 1;
        });

        return {
            elements,
            states: elementStates,
            monthElement
        };
    } catch (error) {
        console.error('计算五行力量时出错:', error);
        return null;
    }
}

// 格式化五行力量显示
function formatWuXingStrength(result) {
    try {
        if (!result || !result.elements) {
            return '计算错误';
        }

        const { elements, states, monthElement } = result;
        
        // 计算总力量
        const totalStrength = Object.values(elements).reduce((sum, value) => sum + value, 0);
        
        // 格式化每个五行的力量
        const formattedElements = Object.entries(elements).map(([element, strength]) => {
            const percentage = ((strength / totalStrength) * 100).toFixed(1);
            const state = states[element];
            return `${element}(${state}): ${percentage}%`;
        });

        // 添加月令信息
        const monthInfo = `月令: ${monthElement}`;

        return `${monthInfo}\n${formattedElements.join('\n')}`;
    } catch (error) {
        console.error('格式化五行力量时出错:', error);
        return '格式化错误';
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
    return new Promise((resolve, reject) => {
        try {
            // 确保 DOM 元素已经加载
            if (!window.elements) {
                throw new Error('DOM 元素尚未初始化');
            }

            const birthdate = elements.birthdate.value;
            const birthtime = elements.birthtime.value;
            const gender = elements.gender.value;
            const address = elements.address.value;

            // 验证输入
            if (!birthdate || !birthtime || !gender || !address) {
                throw new Error('请填写所有必填信息');
            }

            const date = new Date(birthdate);
            if (isNaN(date.getTime())) {
                throw new Error('无效的日期格式');
            }

            const bazi = calculateBaZi(date, parseInt(birthtime));
            if (!bazi) {
                throw new Error('八字计算失败');
            }

            // 使用 displayResults 函数来更新显示
            displayResults(bazi, { gender, address })
                .then(() => {
                    resolve();
                })
                .catch(error => {
                    console.error('显示结果时出错:', error);
                    reject(error);
                });

        } catch (error) {
            console.error('排盘计算错误:', error);
            reject(error);
        }
    });
}

// 检查所有必填字段是否已填写
function checkAllFieldsFilled() {
    return elements.birthdate.value && 
           elements.birthtime.value && 
           elements.gender.value && 
           elements.address.value;
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
        title.textContent = '历史地址';
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
    // 等待 DOM 完全加载
    document.addEventListener('DOMContentLoaded', function() {
        try {
            // 初始化全局 elements 对象
            window.elements = {
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
            const missingElements = [];
            Object.entries(elements).forEach(([key, element]) => {
                if (!element) {
                    missingElements.push(key);
                }
            });

            if (missingElements.length > 0) {
                throw new Error(`找不到必需的DOM元素: ${missingElements.join(', ')}`);
            }

            // 初始化其他功能
            checkDependencies();
            initDatePicker();
            
            // 获取当前位置
            const getLocationBtn = document.getElementById('getLocation');
            if (getLocationBtn) {
                getLocationBtn.addEventListener('click', function() {
                    if (navigator.geolocation) {
                        // 显示加载状态
                        getLocationBtn.disabled = true;
                        getLocationBtn.innerHTML = '<div class="spinner"></div>';
                        
                        navigator.geolocation.getCurrentPosition(
                            function(position) {
                                const { latitude, longitude } = position.coords;
                                document.getElementById('latitude').value = latitude;
                                document.getElementById('longitude').value = longitude;
                                
                                // 使用高德地图API进行逆地理编码
                                AMap.plugin('AMap.Geocoder', function() {
                                    const geocoder = new AMap.Geocoder();
                                    geocoder.getAddress([longitude, latitude], function(status, result) {
                                        if (status === 'complete' && result.info === 'OK') {
                                            const address = result.regeocode.formattedAddress;
                                            document.getElementById('address').value = address;
                                            saveAddressToHistory(address);
                                            checkAndSubmit();
                                        }
                                        // 恢复按钮状态
                                        getLocationBtn.disabled = false;
                                        getLocationBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 5.52 8 12 8 12s8-6.48 8-12a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>';
                                    });
                                });
                            },
                            function(error) {
                                console.error('获取位置失败:', error);
                                getLocationBtn.disabled = false;
                                getLocationBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 5.52 8 12 8 12s8-6.48 8-12a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>';
                            }
                        );
                    }
                });
            }

            // 添加计算按钮事件监听器
            const calculateBtn = document.getElementById('calculateBtn');
            if (calculateBtn) {
                calculateBtn.addEventListener('click', function() {
                    if (checkAllFieldsFilled()) {
                        performBaZiCalculation()
                            .then(() => {
                                // 计算成功后显示提交按钮
                                const submitBtn = document.getElementById('submitBtn');
                                if (submitBtn) {
                                    submitBtn.style.display = 'block';
                                }
                            })
                            .catch(error => {
                                console.error('计算失败:', error);
                            });
                    }
                });
            }

            // 添加表单提交事件监听器
            if (elements.dateForm) {
                elements.dateForm.addEventListener('submit', function(event) {
                    event.preventDefault();
                    if (checkAllFieldsFilled()) {
                        checkAndSubmit();
                    }
                });
            }

            // 初始化地址历史显示
            updateAddressHistoryDisplay();
        } catch (error) {
            console.error('初始化应用时出错:', error);
        }
    });
}

// 当页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);

function displayResults(bazi, additionalInfo) {
    return new Promise((resolve, reject) => {
        try {
            if (!elements.resultSection) {
                console.error('找不到结果区域元素');
                reject(new Error('找不到结果区域元素'));
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
                solarDate: bazi.solarDate,
                lunarDate: bazi.lunarDate,
                yearGan: bazi.yearGan,
                yearZhi: bazi.yearZhi,
                monthGan: bazi.monthGan,
                monthZhi: bazi.monthZhi,
                dayGan: bazi.dayGan,
                dayZhi: bazi.dayZhi,
                hourGan: bazi.hourGan,
                hourZhi: bazi.hourZhi,
                dayMaster: bazi.dayGan,
                fiveElements: elements.fiveElements.innerHTML,
                favorableElements: favorable.join(' '),
                unfavorableElements: unfavorable.join(' ')
            };

            // 调用 DeepSeek 分析
            analyzeWithDeepSeek(baziData, additionalInfo.gender, additionalInfo.address)
                .then(resolve)
                .catch(reject);
        } catch (error) {
            console.error('显示结果时出错:', error);
            reject(error);
        }
    });
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
    
    if (!deepseekSection || !deepseekLoading || !deepseekResult) {
        console.error('找不到必要的DOM元素:', {
            deepseekSection: !!deepseekSection,
            deepseekLoading: !!deepseekLoading,
            deepseekResult: !!deepseekResult
        });
        return;
    }
    
    // 显示分析区域和加载动画
    deepseekSection.style.display = 'block';
    deepseekLoading.style.display = 'block';
    deepseekResult.innerHTML = '';
    
    try {
        console.log('准备发送分析请求:', { baziData, gender, address });
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            credentials: 'omit',
            body: JSON.stringify({
                bazi: baziData,
                gender: gender,
                address: address
            })
        });
        
        console.log('收到服务器响应:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API 错误响应:', errorData);
            if (errorData.error && errorData.error.includes('Insufficient Balance')) {
                throw new Error('AI 分析服务暂时不可用（账户余额不足），请联系管理员充值。');
            }
            throw new Error(errorData.error || errorData.details || `分析请求失败，请稍后重试 (${response.status} ${response.statusText})`);
        }
        
        const data = await response.json();
        console.log('分析结果:', data);
        
        if (!data || Object.keys(data).length === 0) {
            throw new Error('未收到有效的分析结果');
        }
        
        // 格式化分析结果
        const formattedResult = `
            <div class="analysis-section">
                <h3>性格特征</h3>
                <p>${data.personality || '暂无分析'}</p>
                
                <h3>财运分析</h3>
                <p>${data.wealth || '暂无分析'}</p>
                
                <h3>事业运势</h3>
                <p>${data.career || '暂无分析'}</p>
                
                <h3>健康状况</h3>
                <p>${data.health || '暂无分析'}</p>
                
                <h3>婚姻生活</h3>
                <p>${data.marriage || '暂无分析'}</p>
            </div>
        `;
        
        deepseekResult.innerHTML = formattedResult;
        return data;
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
                <p>错误详情：${error.message}</p>
            </div>
        `;
        throw error;
    } finally {
        deepseekLoading.style.display = 'none';
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

function updateDisplay(bazi) {
    try {
        // 检查必要的 DOM 元素是否存在
        const requiredElements = {
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

        // 检查是否有缺失的元素
        const missingElements = Object.entries(requiredElements)
            .filter(([_, element]) => !element)
            .map(([name]) => name);

        if (missingElements.length > 0) {
            throw new Error(`找不到必要的DOM元素: ${missingElements.join(', ')}`);
        }

        // 更新八字显示
        requiredElements.yearGan.textContent = bazi.yearGan || '-';
        requiredElements.yearZhi.textContent = bazi.yearZhi || '-';
        requiredElements.monthGan.textContent = bazi.monthGan || '-';
        requiredElements.monthZhi.textContent = bazi.monthZhi || '-';
        requiredElements.dayGan.textContent = bazi.dayGan || '-';
        requiredElements.dayZhi.textContent = bazi.dayZhi || '-';
        requiredElements.hourGan.textContent = bazi.hourGan || '-';
        requiredElements.hourZhi.textContent = bazi.hourZhi || '-';

        // 计算并显示五行力量
        const wuxingResult = calculateWuXingStrength(bazi);
        if (wuxingResult) {
            requiredElements.dayMaster.textContent = bazi.dayGan || '-';
            requiredElements.fiveElements.textContent = formatWuXingStrength(wuxingResult);
        }

        // 显示结果区域
        requiredElements.resultSection.style.display = 'block';

        // 更新太岁信息
        updateTaiSuiInfo(bazi);

    } catch (error) {
        console.error('更新显示时出错:', error);
        // 显示错误信息给用户
        const resultSection = document.getElementById('resultSection');
        if (resultSection) {
            resultSection.style.display = 'block';
            resultSection.innerHTML = `<div class="error-message">计算过程中出现错误: ${error.message}</div>`;
        }
    }
} 