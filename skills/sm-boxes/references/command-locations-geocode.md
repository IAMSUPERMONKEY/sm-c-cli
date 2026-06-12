# 原子命令：locations geocode（地理编码）

```
sm-c-cli boxes locations geocode --keyword "<地理位置描述>"
```

参数：

- `--keyword`（必填）：用户口述的位置，原样传入；带空格 / 中文的描述务必加双引号。
  - 不要编造门牌号或路名，用户怎么说就怎么传，必要时只补全城市 / 区前缀。

## 使用示例

```
sm-c-cli boxes locations geocode --keyword "海岸城"
sm-c-cli boxes locations geocode --keyword "上海市静安区静安寺"
```

## 返回字段

stdout 是 `{ code, data, msg }` 信封；成功时 `data.list` 是候选地址数组（**可能为空 / 1 条 / 多条**），每条包含：

| 字段                     | 含义        |
| ------------------------ | ----------- |
| `address`                | 完整地址    |
| `country`                | 国家        |
| `province`               | 省份        |
| `city`                   | 城市        |
| `district`               | 区域        |
| `longitude` / `latitude` | 经度 / 纬度 |

> 这条命令的返回值不是直接给用户看的最终答案——它的产物（经纬度）是给 `+search-by-geo` 用的。具体怎么处理 0 / 1 / 多条候选，见 [SKILL.md 附近门店查询流程](../SKILL.md#附近门店查询流程仅适用于-search-by-geo) 第 3 步。
