"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageNavbar } from "@/components/PageNavbar/PageNavbar";
import { useTrip } from "@/src/lib/hooks/use-trip";
import { parseTags } from "@/src/domain/format";
import s from "./page.module.css";

const AGE_OPTIONS = Array.from({ length: 75 }, (_, index) => String(index + 16));
const DEFAULT_AGE = 18;

// 地区数据
const REGION_DATA = {
  "北京市": {
    cities: {
      "北京市": ["东城区", "西城区", "朝阳区", "丰台区", "石景山区", "海淀区", "门头沟区", "房山区", "通州区", "顺义区", "昌平区", "大兴区", "怀柔区", "平谷区", "密云区", "延庆区"]
    }
  },
  "天津市": {
    cities: {
      "天津市": ["和平区", "河东区", "河西区", "南开区", "河北区", "红桥区", "东丽区", "西青区", "津南区", "北辰区", "武清区", "宝坻区", "滨海新区", "宁河区", "静海区", "蓟州区"]
    }
  },
  "河北省": {
    cities: {
      "石家庄市": ["长安区", "桥西区", "新华区", "井陉矿区", "裕华区", "藁城区", "鹿泉区", "栾城区", "井陉县", "正定县", "行唐县", "灵寿县", "高邑县", "深泽县", "赞皇县", "无极县", "平山县", "元氏县", "赵县", "辛集市", "晋州市", "新乐市"],
      "唐山市": ["路南区", "路北区", "古冶区", "开平区", "丰南区", "丰润区", "曹妃甸区", "滦南县", "乐亭县", "迁西县", "玉田县", "遵化市", "迁安市", "滦州市"]
    }
  },
  "山西省": {
    cities: {
      "太原市": ["小店区", "迎泽区", "杏花岭区", "尖草坪区", "万柏林区", "晋源区", "清徐县", "阳曲县", "娄烦县", "古交市"],
      "大同市": ["新荣区", "平城区", "云冈区", "云州区", "阳高县", "天镇县", "广灵县", "灵丘县", "浑源县", "左云县"]
    }
  },
  "内蒙古自治区": {
    cities: {
      "呼和浩特市": ["新城区", "回民区", "玉泉区", "赛罕区", "土默特左旗", "托克托县", "和林格尔县", "清水河县", "武川县"],
      "包头市": ["东河区", "昆都仑区", "青山区", "石拐区", "白云鄂博矿区", "九原区", "土默特右旗", "固阳县", "达尔罕茂明安联合旗"]
    }
  },
  "辽宁省": {
    cities: {
      "沈阳市": ["和平区", "沈河区", "大东区", "皇姑区", "铁西区", "苏家屯区", "浑南区", "沈北新区", "于洪区", "辽中区", "康平县", "法库县", "新民市"],
      "大连市": ["中山区", "西岗区", "沙河口区", "甘井子区", "旅顺口区", "金州区", "普兰店区", "瓦房店市", "庄河市", "长海县"]
    }
  },
  "吉林省": {
    cities: {
      "长春市": ["南关区", "宽城区", "朝阳区", "二道区", "绿园区", "双阳区", "九台区", "农安县", "榆树市", "德惠市", "公主岭市"],
      "吉林市": ["昌邑区", "龙潭区", "船营区", "丰满区", "永吉县", "蛟河市", "桦甸市", "舒兰市", "磐石市"]
    }
  },
  "黑龙江省": {
    cities: {
      "哈尔滨市": ["道里区", "南岗区", "道外区", "平房区", "松北区", "香坊区", "呼兰区", "阿城区", "双城区", "依兰县", "方正县", "宾县", "巴彦县", "木兰县", "通河县", "延寿县", "尚志市", "五常市"],
      "齐齐哈尔市": ["龙沙区", "建华区", "铁锋区", "昂昂溪区", "富拉尔基区", "碾子山区", "梅里斯达斡尔族区", "龙江县", "依安县", "泰来县", "甘南县", "富裕县", "克山县", "克东县", "拜泉县", "讷河市"]
    }
  },
  "上海市": {
    cities: {
      "上海市": ["黄浦区", "徐汇区", "长宁区", "静安区", "普陀区", "虹口区", "杨浦区", "浦东新区", "闵行区", "宝山区", "嘉定区", "金山区", "松江区", "青浦区", "奉贤区", "崇明区"]
    }
  },
  "江苏省": {
    cities: {
      "南京市": ["玄武区", "秦淮区", "建邺区", "鼓楼区", "浦口区", "栖霞区", "雨花台区", "江宁区", "六合区", "溧水区", "高淳区"],
      "苏州市": ["姑苏区", "虎丘区", "吴中区", "相城区", "吴江区", "苏州工业园区", "常熟市", "张家港市", "昆山市", "太仓市"]
    }
  },
  "浙江省": {
    cities: {
      "杭州市": ["上城区", "下城区", "江干区", "拱墅区", "西湖区", "滨江区", "萧山区", "余杭区", "富阳区", "临安区", "桐庐县", "淳安县", "建德市"],
      "宁波市": ["海曙区", "江北区", "北仑区", "镇海区", "鄞州区", "奉化区", "象山县", "宁海县", "余姚市", "慈溪市"]
    }
  },
  "安徽省": {
    cities: {
      "合肥市": ["瑶海区", "庐阳区", "蜀山区", "包河区", "长丰县", "肥东县", "肥西县", "庐江县", "巢湖市"],
      "芜湖市": ["镜湖区", "弋江区", "鸠江区", "三山区", "芜湖县", "繁昌县", "南陵县", "无为市"]
    }
  },
  "福建省": {
    cities: {
      "福州市": ["鼓楼区", "台江区", "仓山区", "马尾区", "晋安区", "长乐区", "闽侯县", "连江县", "罗源县", "闽清县", "永泰县", "平潭县", "福清市"],
      "厦门市": ["思明区", "海沧区", "湖里区", "集美区", "同安区", "翔安区"]
    }
  },
  "江西省": {
    cities: {
      "南昌市": ["东湖区", "西湖区", "青云谱区", "湾里区", "青山湖区", "新建区", "南昌县", "安义县", "进贤县"],
      "九江市": ["濂溪区", "浔阳区", "柴桑区", "武宁县", "修水县", "永修县", "德安县", "都昌县", "湖口县", "彭泽县", "瑞昌市", "共青城市", "庐山市"]
    }
  },
  "山东省": {
    cities: {
      "济南市": ["历下区", "市中区", "槐荫区", "天桥区", "历城区", "长清区", "章丘区", "济阳区", "莱芜区", "钢城区", "平阴县", "商河县"],
      "青岛市": ["市南区", "市北区", "黄岛区", "崂山区", "李沧区", "城阳区", "即墨区", "胶州市", "平度市", "莱西市"]
    }
  },
  "河南省": {
    cities: {
      "郑州市": ["中原区", "二七区", "管城回族区", "金水区", "上街区", "惠济区", "中牟县", "巩义市", "荥阳市", "新密市", "新郑市", "登封市"],
      "开封市": ["龙亭区", "顺河回族区", "鼓楼区", "禹王台区", "祥符区", "杞县", "通许县", "尉氏县", "兰考县"]
    }
  },
  "湖北省": {
    cities: {
      "武汉市": ["江岸区", "江汉区", "硚口区", "汉阳区", "武昌区", "青山区", "洪山区", "东西湖区", "汉南区", "蔡甸区", "江夏区", "黄陂区", "新洲区"],
      "黄石市": ["黄石港区", "西塞山区", "下陆区", "铁山区", "阳新县", "大冶市"]
    }
  },
  "湖南省": {
    cities: {
      "长沙市": ["芙蓉区", "天心区", "岳麓区", "开福区", "雨花区", "望城区", "长沙县", "宁乡市", "浏阳市"],
      "株洲市": ["荷塘区", "芦淞区", "石峰区", "天元区", "株洲县", "攸县", "茶陵县", "炎陵县", "醴陵市"]
    }
  },
  "广东省": {
    cities: {
      "广州市": ["越秀区", "海珠区", "荔湾区", "天河区", "白云区", "黄埔区", "番禺区", "花都区", "南沙区", "从化区", "增城区"],
      "深圳市": ["罗湖区", "福田区", "南山区", "宝安区", "龙岗区", "盐田区", "龙华区", "坪山区", "光明区", "大鹏新区"]
    }
  },
  "广西壮族自治区": {
    cities: {
      "南宁市": ["兴宁区", "青秀区", "江南区", "西乡塘区", "良庆区", "邕宁区", "武鸣区", "隆安县", "马山县", "上林县", "宾阳县", "横县"],
      "柳州市": ["城中区", "鱼峰区", "柳南区", "柳北区", "柳江区", "柳城县", "鹿寨县", "融安县", "融水苗族自治县", "三江侗族自治县"]
    }
  },
  "海南省": {
    cities: {
      "海口市": ["秀英区", "龙华区", "琼山区", "美兰区"],
      "三亚市": ["海棠区", "吉阳区", "天涯区", "崖州区"]
    }
  },
  "重庆市": {
    cities: {
      "重庆市": ["万州区", "涪陵区", "渝中区", "大渡口区", "江北区", "沙坪坝区", "九龙坡区", "南岸区", "北碚区", "綦江区", "大足区", "渝北区", "巴南区", "黔江区", "长寿区", "江津区", "合川区", "永川区", "南川区", "璧山区", "铜梁区", "潼南区", "荣昌区", "开州区", "梁平区", "武隆区"]
    }
  },
  "四川省": {
    cities: {
      "成都市": ["锦江区", "青羊区", "金牛区", "武侯区", "成华区", "龙泉驿区", "青白江区", "新都区", "温江区", "双流区", "郫都区", "金堂县", "大邑县", "蒲江县", "新津县", "都江堰市", "彭州市", "邛崃市", "崇州市", "简阳市"],
      "绵阳市": ["涪城区", "游仙区", "安州区", "三台县", "盐亭县", "梓潼县", "北川羌族自治县", "平武县", "江油市"]
    }
  },
  "贵州省": {
    cities: {
      "贵阳市": ["南明区", "云岩区", "花溪区", "乌当区", "白云区", "观山湖区", "开阳县", "息烽县", "修文县", "清镇市"],
      "遵义市": ["红花岗区", "汇川区", "播州区", "桐梓县", "绥阳县", "正安县", "道真仡佬族苗族自治县", "务川仡佬族苗族自治县", "凤冈县", "湄潭县", "余庆县", "习水县", "赤水市", "仁怀市"]
    }
  },
  "云南省": {
    cities: {
      "昆明市": ["五华区", "盘龙区", "官渡区", "西山区", "东川区", "呈贡区", "晋宁区", "富民县", "宜良县", "石林彝族自治县", "嵩明县", "禄劝彝族苗族自治县", "寻甸回族彝族自治县", "安宁市"],
      "曲靖市": ["麒麟区", "沾益区", "马龙区", "陆良县", "师宗县", "罗平县", "富源县", "会泽县", "宣威市"]
    }
  },
  "西藏自治区": {
    cities: {
      "拉萨市": ["城关区", "堆龙德庆区", "达孜区", "林周县", "当雄县", "尼木县", "曲水县", "墨竹工卡县"],
      "日喀则市": ["桑珠孜区", "南木林县", "江孜县", "定日县", "萨迦县", "拉孜县", "昂仁县", "谢通门县", "白朗县", "仁布县", "康马县", "定结县", "仲巴县", "亚东县", "吉隆县", "聂拉木县", "萨嘎县", "岗巴县"]
    }
  },
  "陕西省": {
    cities: {
      "西安市": ["新城区", "碑林区", "莲湖区", "灞桥区", "未央区", "雁塔区", "阎良区", "临潼区", "长安区", "高陵区", "鄠邑区", "蓝田县", "周至县"],
      "宝鸡市": ["渭滨区", "金台区", "陈仓区", "凤翔县", "岐山县", "扶风县", "眉县", "陇县", "千阳县", "麟游县", "凤县", "太白县"]
    }
  },
  "甘肃省": {
    cities: {
      "兰州市": ["城关区", "七里河区", "西固区", "安宁区", "红古区", "永登县", "皋兰县", "榆中县"],
      "嘉峪关市": ["嘉峪关市"]
    }
  },
  "青海省": {
    cities: {
      "西宁市": ["城东区", "城中区", "城西区", "城北区", "大通回族土族自治县", "湟中县", "湟源县"],
      "海东市": ["乐都区", "平安区", "民和回族土族自治县", "互助土族自治县", "化隆回族自治县", "循化撒拉族自治县"]
    }
  },
  "宁夏回族自治区": {
    cities: {
      "银川市": ["兴庆区", "西夏区", "金凤区", "永宁县", "贺兰县", "灵武市"],
      "石嘴山市": ["大武口区", "惠农区", "平罗县"]
    }
  },
  "新疆维吾尔自治区": {
    cities: {
      "乌鲁木齐市": ["天山区", "沙依巴克区", "新市区", "水磨沟区", "头屯河区", "达坂城区", "米东区", "乌鲁木齐县"],
      "克拉玛依市": ["独山子区", "克拉玛依区", "白碱滩区", "乌尔禾区"]
    }
  },
  "香港特别行政区": {
    cities: {
      "香港特别行政区": ["香港岛", "九龙半岛", "新界"]
    }
  },
  "澳门特别行政区": {
    cities: {
      "澳门特别行政区": ["澳门半岛", "氹仔岛", "路环岛"]
    }
  },
  "台湾省": {
    cities: {
      "台北市": ["中正区", "大同区", "中山区", "松山区", "大安区", "万华区", "信义区", "士林区", "北投区", "内湖区", "南港区", "文山区"],
      "高雄市": ["新兴区", "前金区", "芩雅区", "盐埕区", "鼓山区", "旗津区", "前镇区", "三民区", "左营区", "楠梓区", "小港区"]
    }
  }
};

// 省份列表
const PROVINCES = Object.keys(REGION_DATA);

function resolveAgePickerIndex(age: string): number {
  const numericAge = Number(age);
  if (!Number.isInteger(numericAge)) {
    return 0;
  }

  const targetAge = numericAge >= 16 && numericAge <= 90 ? numericAge : DEFAULT_AGE;
  return Math.max(0, AGE_OPTIONS.indexOf(String(targetAge)));
}

export default function TagEditorPage() {
  const router = useRouter();
  const { getTagEditorData, updateProfile, refresh } = useTrip();

  const [viewModel, setViewModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [bio, setBio] = useState("");
  const [livingCity, setLivingCity] = useState("");
  const [livingRegion, setLivingRegion] = useState<string[]>(["", "", ""]);
  const [hometown, setHometown] = useState("");
  const [hometownRegion, setHometownRegion] = useState<string[]>(["", ""]);
  const [agePickerIndex, setAgePickerIndex] = useState(0);
  const [age, setAge] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  // 地区选择器状态
  const [showLivingPicker, setShowLivingPicker] = useState(false);
  const [showHometownPicker, setShowHometownPicker] = useState(false);
  const [showAgePicker, setShowAgePicker] = useState(false);
  
  // 地区选择器临时状态
  const [tempLivingProvince, setTempLivingProvince] = useState("");
  const [tempLivingCity, setTempLivingCity] = useState("");
  const [tempLivingDistrict, setTempLivingDistrict] = useState("");
  const [tempHometownProvince, setTempHometownProvince] = useState("");
  const [tempHometownCity, setTempHometownCity] = useState("");

  const previewTags = useMemo(() => {
    return parseTags(tagsInput);
  }, [tagsInput]);

  const authNickname = viewModel?.authNickname || "用户昵称";
  const authAvatarUrl = viewModel?.authAvatarUrl || "";

  const refreshPage = useCallback(async () => {
    try {
      const viewModel = await getTagEditorData();
      setViewModel(viewModel);
      applyViewModel(viewModel);
    } catch (error) {
      console.error("Failed to load tag editor data:", error);
      router.push("/profile");
    } finally {
      setLoading(false);
    }
  }, [getTagEditorData, router]);

  const applyViewModel = useCallback((viewModel: any) => {
    setBio(viewModel.bio);
    setLivingCity(viewModel.livingCity);
    setLivingRegion(viewModel.livingRegion || ["", "", ""]);
    setHometown(viewModel.hometown);
    setHometownRegion(viewModel.hometownRegion || ["", ""]);
    setAgePickerIndex(resolveAgePickerIndex(viewModel.age));
    setAge(viewModel.age);
    setTagsInput(viewModel.tagsInput);
  }, []);

  useEffect(() => {
    refreshPage();
  }, [refreshPage]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2000);
  }, []);

  const handlePreviewAvatar = useCallback(() => {
    if (authAvatarUrl) {
      window.open(authAvatarUrl, "_blank", "width=400,height=400");
    }
  }, [authAvatarUrl]);

  // 处理居住地区选择
  const handleLivingProvinceSelect = useCallback((province: string) => {
    setTempLivingProvince(province);
    setTempLivingCity("");
    setTempLivingDistrict("");
  }, []);

  const handleLivingCitySelect = useCallback((city: string) => {
    setTempLivingCity(city);
    setTempLivingDistrict("");
  }, []);

  const handleLivingDistrictSelect = useCallback((district: string) => {
    setTempLivingDistrict(district);
  }, []);

  const handleLivingBackToProvince = useCallback(() => {
    setTempLivingProvince("");
    setTempLivingCity("");
    setTempLivingDistrict("");
  }, []);

  const handleLivingBackToCity = useCallback(() => {
    setTempLivingCity("");
    setTempLivingDistrict("");
  }, []);

  const handleLivingRegionConfirm = useCallback(() => {
    if (tempLivingProvince && tempLivingCity && tempLivingDistrict) {
      const newRegion = [tempLivingProvince, tempLivingCity, tempLivingDistrict];
      setLivingRegion(newRegion);
      setLivingCity(newRegion.slice(0, 3).join(""));
      setShowLivingPicker(false);
    }
  }, [tempLivingProvince, tempLivingCity, tempLivingDistrict]);

  // 处理家乡地区选择
  const handleHometownProvinceSelect = useCallback((province: string) => {
    setTempHometownProvince(province);
    setTempHometownCity("");
  }, []);

  const handleHometownCitySelect = useCallback((city: string) => {
    setTempHometownCity(city);
  }, []);

  const handleHometownBackToProvince = useCallback(() => {
    setTempHometownProvince("");
    setTempHometownCity("");
  }, []);

  const handleHometownRegionConfirm = useCallback(() => {
    if (tempHometownProvince && tempHometownCity) {
      const newRegion = [tempHometownProvince, tempHometownCity];
      setHometownRegion(newRegion);
      setHometown(newRegion.slice(0, 2).join(""));
      setShowHometownPicker(false);
    }
  }, [tempHometownProvince, tempHometownCity]);

  // 处理年龄选择
  const handleAgeSelect = useCallback((selectedAge: string, index: number) => {
    setAgePickerIndex(index);
    setAge(selectedAge);
    setShowAgePicker(false);
  }, []);

  const handleSave = useCallback(async () => {
    setSubmitting(true);
    try {
      await updateProfile({
        bio,
        livingCity,
        hometown,
        age,
        tagsInput,
      });
      showToast("个人资料已保存");
      router.back();
    } catch {
      showToast("保存失败，请重试");
    } finally {
      setSubmitting(false);
    }
  }, [bio, livingCity, hometown, age, tagsInput, router, showToast, updateProfile]);

  if (loading) {
    return (
      <div className={s.page}>
        <PageNavbar title="编辑资料" onBack={() => router.back()} />
        <div className={s.loadingWrap}>
          <span style={{ color: "#c2c2c2", fontSize: 13 }}>加载中...</span>
        </div>
      </div>
    );
  }

  if (!viewModel) {
    return null;
  }

  return (
    <div className={s.page}>
      <PageNavbar title="编辑资料" onBack={() => router.back()} />

      <div className={s.content}>
        {/* 基础信息区 */}
        <div className={s.section}>
          <div className={s.editorSectionTitle}>基础信息</div>
          <div className={s.editorCard}>
            {/* 头像 */}
            <div className={`${s.editorRow} ${s.editorRowAvatar}`} onClick={handlePreviewAvatar}>
              <span className={s.editorRowLabel}>头像</span>
              <div className={`${s.editorRowMain} ${s.editorRowMainAvatar}`}>
                {authAvatarUrl ? (
                  <img
                    src={authAvatarUrl}
                    alt="头像"
                    className={s.editorAvatar}
                  />
                ) : (
                  <div className={`${s.editorAvatar} ${s.editorAvatarFallback}`}>
                    {authNickname.charAt(0)}
                  </div>
                )}
                <div className={s.editorRowCaret} />
              </div>
            </div>

            {/* 名称 */}
            <div className={s.editorRow}>
              <span className={s.editorRowLabel}>名称</span>
              <div className={s.editorRowMain}>
                <span className={`${s.editorRowValue} ${s.editorRowValueMuted}`}>
                  {authNickname}
                </span>
              </div>
            </div>

            {/* 居住 */}
            <div className={s.editorRow} onClick={() => {
              // 回填当前已选值
              setTempLivingProvince(livingRegion[0] || "");
              setTempLivingCity(livingRegion[1] || "");
              setTempLivingDistrict(livingRegion[2] || "");
              setShowLivingPicker(true);
            }}>
              <span className={s.editorRowLabel}>居住</span>
              <div className={s.editorRowMain}>
                <div className={`${s.editorRowValueWrap} ${s.editorRowValueWrapLifted}`}>
                  <span className={`${s.editorRowValue} ${!livingCity ? s.editorRowValuePlaceholder : ""}`}>
                    {livingCity ? livingCity : "请选择居住地"}
                  </span>
                </div>
                <div className={s.editorRowCaret} />
              </div>
            </div>

            {/* 来自 */}
            <div className={s.editorRow} onClick={() => {
              // 回填当前已选值
              setTempHometownProvince(hometownRegion[0] || "");
              setTempHometownCity(hometownRegion[1] || "");
              setShowHometownPicker(true);
            }}>
              <span className={s.editorRowLabel}>来自</span>
              <div className={s.editorRowMain}>
                <div className={`${s.editorRowValueWrap} ${s.editorRowValueWrapLifted}`}>
                  <span className={`${s.editorRowValue} ${!hometown ? s.editorRowValuePlaceholder : ""}`}>
                    {hometown ? hometown : "请选择省市"}
                  </span>
                </div>
                <div className={s.editorRowCaret} />
              </div>
            </div>

            {/* 年龄 */}
            <div className={s.editorRow} onClick={() => setShowAgePicker(true)}>
              <span className={s.editorRowLabel}>年龄</span>
              <div className={s.editorRowMain}>
                <div className={s.editorRowValueWrap}>
                  <span className={`${s.editorRowValue} ${!age ? s.editorRowValuePlaceholder : ""}`}>
                    {age ? `${age}岁` : "请选择年龄"}
                  </span>
                </div>
                <div className={s.editorRowCaret} />
              </div>
            </div>

          </div>
        </div>

        {/* 有话要说 */}
        <div className={s.section}>
          <div className={s.editorSectionTitle}>有话要说</div>
          <textarea
            className={s.editorTextarea}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="请输入你想说的话"
            maxLength={40}
          />
        </div>

        {/* Tips */}
        <div className={s.section}>
          <div className={s.editorSectionTitle}>Tips</div>
          <textarea
            className={s.editorTextarea}
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="每个Tips不超过6个字,最多4个,以换行分割"
            maxLength={80}
          />
          {previewTags.length > 0 && (
            <div className={`${s.tagList} ${s.editorTagList}`}>
              {previewTags.map((tag: string, index: number) => (
                <span key={index} className={`${s.tagChip} ${s.editorTagChip}`}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 保存栏 */}
      <div className={s.editorSaveBar}>
        <button
          className={`${s.editorSaveBtn} ${submitting ? s.editorSaveBtnDisabled : ""}`}
          onClick={handleSave}
          disabled={submitting}
        >
          {submitting ? "保存中..." : "保存"}
        </button>
      </div>

      {/* 居住地区选择器 */}
      {showLivingPicker && (
        <div className={s.pickerOverlay} onClick={() => setShowLivingPicker(false)}>
          <div className={s.picker} onClick={(e) => e.stopPropagation()}>
            <div className={s.pickerHeader}>
              <div className={s.pickerTitle}>选择居住地</div>
              <button className={s.pickerClose} onClick={() => setShowLivingPicker(false)}>✕</button>
            </div>
            
            {/* 步骤导航 */}
            <div className={s.pickerSteps}>
              <button 
                className={`${s.pickerStep} ${!tempLivingProvince || (tempLivingProvince && !tempLivingCity && !tempLivingDistrict) ? s.pickerStepActive : ""}`}
                onClick={handleLivingBackToProvince}
              >
                省份
              </button>
              <div className={s.pickerStepDivider} />
              <button 
                className={`${s.pickerStep} ${tempLivingProvince && (!tempLivingCity || (tempLivingCity && !tempLivingDistrict)) ? s.pickerStepActive : ""}`}
                onClick={tempLivingProvince ? handleLivingBackToCity : undefined}
                disabled={!tempLivingProvince}
              >
                城市
              </button>
              <div className={s.pickerStepDivider} />
              <button 
                className={`${s.pickerStep} ${tempLivingProvince && tempLivingCity ? s.pickerStepActive : ""}`}
                disabled={!tempLivingProvince || !tempLivingCity}
              >
                区县
              </button>
            </div>
            
            <div className={s.pickerContent}>
              {/* 省份选择 */}
              {(tempLivingProvince && !tempLivingCity && !tempLivingDistrict) || !tempLivingProvince && (
                <div className={s.pickerSection}>
                  <div className={s.pickerSectionTitle}>省份</div>
                  {PROVINCES.map((province) => (
                    <div
                      key={province}
                      className={`${s.pickerOption} ${(tempLivingProvince || livingRegion[0]) === province ? s.pickerOptionActive : ""}`}
                      onClick={() => handleLivingProvinceSelect(province)}
                    >
                      {province}
                    </div>
                  ))}
                </div>
              )}
              
              {/* 城市选择 */}
              {tempLivingProvince && (tempLivingCity || !tempLivingCity) && (
                <div className={s.pickerSection}>
                  <div className={s.pickerSectionTitle}>城市</div>
                  {tempLivingProvince in REGION_DATA && Object.keys(REGION_DATA[tempLivingProvince as keyof typeof REGION_DATA].cities).map((city) => (
                    <div
                      key={city}
                      className={`${s.pickerOption} ${(tempLivingCity || livingRegion[1]) === city ? s.pickerOptionActive : ""}`}
                      onClick={() => handleLivingCitySelect(city)}
                    >
                      {city}
                    </div>
                  ))}
                </div>
              )}
              
              {/* 区县选择 */}
              {tempLivingProvince && tempLivingCity && (
                <div className={s.pickerSection}>
                  <div className={s.pickerSectionTitle}>区县</div>
                  {tempLivingProvince in REGION_DATA && (() => {
                    const provinceData = REGION_DATA[tempLivingProvince as keyof typeof REGION_DATA];
                    const cities = provinceData.cities as any;
                    if (cities[tempLivingCity]) {
                      return cities[tempLivingCity].map((district: string) => (
                        <div
                          key={district}
                          className={`${s.pickerOption} ${(tempLivingDistrict || livingRegion[2]) === district ? s.pickerOptionActive : ""}`}
                          onClick={() => handleLivingDistrictSelect(district)}
                        >
                          {district}
                        </div>
                      ));
                    }
                    return null;
                  })()}
                </div>
              )}
              
              {/* 确认按钮 */}
              {tempLivingProvince && tempLivingCity && tempLivingDistrict && (
                <div className={s.pickerConfirmSection}>
                  <button className={s.pickerConfirmBtn} onClick={handleLivingRegionConfirm}>
                    确认选择
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 家乡地区选择器 */}
      {showHometownPicker && (
        <div className={s.pickerOverlay} onClick={() => setShowHometownPicker(false)}>
          <div className={s.picker} onClick={(e) => e.stopPropagation()}>
            <div className={s.pickerHeader}>
              <div className={s.pickerTitle}>选择家乡</div>
              <button className={s.pickerClose} onClick={() => setShowHometownPicker(false)}>✕</button>
            </div>
            
            {/* 步骤导航 */}
            <div className={s.pickerSteps}>
              <button 
                className={`${s.pickerStep} ${!tempHometownProvince || (tempHometownProvince && !tempHometownCity) ? s.pickerStepActive : ""}`}
                onClick={handleHometownBackToProvince}
              >
                省份
              </button>
              <div className={s.pickerStepDivider} />
              <button 
                className={`${s.pickerStep} ${tempHometownProvince ? s.pickerStepActive : ""}`}
                disabled={!tempHometownProvince}
              >
                城市
              </button>
            </div>
            
            <div className={s.pickerContent}>
              {/* 省份选择 */}
              {(tempHometownProvince && !tempHometownCity) || !tempHometownProvince && (
                <div className={s.pickerSection}>
                  <div className={s.pickerSectionTitle}>省份</div>
                  {PROVINCES.map((province) => (
                    <div
                      key={province}
                      className={`${s.pickerOption} ${(tempHometownProvince || hometownRegion[0]) === province ? s.pickerOptionActive : ""}`}
                      onClick={() => handleHometownProvinceSelect(province)}
                    >
                      {province}
                    </div>
                  ))}
                </div>
              )}
              
              {/* 城市选择 */}
              {tempHometownProvince && (tempHometownCity || !tempHometownCity) && (
                <div className={s.pickerSection}>
                  <div className={s.pickerSectionTitle}>城市</div>
                  {tempHometownProvince in REGION_DATA && Object.keys(REGION_DATA[tempHometownProvince as keyof typeof REGION_DATA].cities).map((city) => (
                    <div
                      key={city}
                      className={`${s.pickerOption} ${(tempHometownCity || hometownRegion[1]) === city ? s.pickerOptionActive : ""}`}
                      onClick={() => handleHometownCitySelect(city)}
                    >
                      {city}
                    </div>
                  ))}
                </div>
              )}
              
              {/* 确认按钮 */}
              {tempHometownProvince && tempHometownCity && (
                <div className={s.pickerConfirmSection}>
                  <button className={s.pickerConfirmBtn} onClick={handleHometownRegionConfirm}>
                    确认选择
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 年龄选择器 */}
      {showAgePicker && (
        <div className={s.pickerOverlay} onClick={() => setShowAgePicker(false)}>
          <div className={s.picker} onClick={(e) => e.stopPropagation()}>
            <div className={s.pickerHeader}>
              <div className={s.pickerTitle}>选择年龄</div>
              <button className={s.pickerClose} onClick={() => setShowAgePicker(false)}>✕</button>
            </div>
            <div className={s.pickerContent}>
              {AGE_OPTIONS.map((ageOption, index) => (
                <div
                  key={ageOption}
                  className={`${s.pickerOption} ${age === ageOption ? s.pickerOptionActive : ""}`}
                  onClick={() => handleAgeSelect(ageOption, index)}
                >
                  {ageOption}岁
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={s.toast}>{toast}</div>}
    </div>
  );
}
