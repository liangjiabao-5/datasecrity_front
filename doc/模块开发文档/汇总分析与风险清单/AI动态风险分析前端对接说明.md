# AI动态风险分析前端对接说明

更新时间：2026-08-13

## 1. 变更目标

汇总分析中每条风险记录的“风险描述”“风险源描述”“整改建议”不再使用固定模板文本。后端在刷新汇总分析时，以现场测评的评估项、实施要求、评估记录和符合情况为输入调用 AI 生成三项内容。

本说明面向正式前端工程。`原型/` 目录中的页面仅用于展示，不是前端实现文件，也不应作为改造目标。

## 2. 前端改造范围

涉及汇总分析页面的三个列表页签：

| 页签 | 列表接口 | AI 生成内容 | 可保存的人工修改 |
| --- | --- | --- | --- |
| 数据安全风险源清单 | `GET /api/v1/projects/{projectId}/risk-sources` | `riskDescription`、`riskSourceDescription` | `riskDescription`、`riskSourceDescription` |
| 数据安全风险清单 | `GET /api/v1/projects/{projectId}/risk-items` | 读取并展示 `riskDescription`、`riskSourceDescription` | 不在本页修改 AI 文本；仅保留原有风险等级相关编辑 |
| 数据安全风险处置建议 | `GET /api/v1/projects/{projectId}/risk-suggestions` | `remediationSuggestion` | `remediationSuggestion` |

三个页签读的是同一条风险汇总记录的不同视图，因此三个 ID 字段均对应同一个 `riskRecordId`，但保存时必须使用本页指定的接口。

## 3. 刷新汇总分析与加载态

### 3.1 刷新接口

```http
POST /api/v1/projects/{projectId}/risk-summary/refresh
Content-Type: application/json
```

普通刷新请求体：

```json
{}
```

若用户明确要求以当前现场测评结果重新生成，并覆盖已人工修改的三项文本，请求体为：

```json
{
  "overwriteManualChanges": true
}
```

接口成功响应中的 `data` 示例：

```json
{
  "createdRecords": 2,
  "updatedRecords": 8,
  "inactiveRecords": 1,
  "retainedManualRecords": 3,
  "score": 76.5,
  "possibilityLevel": "MEDIUM",
  "scoreModelVersion": "V1",
  "analysisSuccessRecords": 6,
  "analysisDisabledRecords": 0,
  "analysisFailedRecords": 1
}
```

完整响应统一包裹为：

```json
{
  "code": "SUCCESS",
  "message": "Operation succeeded.",
  "data": {},
  "traceId": "..."
}
```

### 3.2 必须实现的交互

刷新需要逐条调用 AI，耗时随待分析记录数量增加。前端必须：

1. 点击“刷新汇总分析”后立即禁用按钮，防止重复提交。
2. 显示全屏或页面级遮罩和旋转加载图标，文案建议为“正在逐条生成风险描述、风险源描述和整改建议，请勿重复操作”。
3. 该接口暂不返回逐条进度，使用不确定进度的加载态，不显示虚假的百分比。
4. 请求完成后关闭遮罩、恢复按钮，并重新加载三个列表及相关统计数据。
5. 请求失败时关闭遮罩、恢复按钮，并展示接口 `message`；不清空当前列表。

`manualAdjusted` 是后端按风险记录保存的整行锁定标记，前端无需、也不能在保存请求中自行设置它。用户对本行任一可编辑字段产生实际变更后，后端会将其置为 `true`。空保存、只传记录 ID 或提交与当前值相同的内容，不会锁定该行。

普通“刷新汇总分析”不覆盖 `manualAdjusted=true` 的记录：该行保留原有评估投影、风险字段和 AI 文本，不会调用 AI。若该指标更新为“符合”或“不适用”，后端仍会将记录标记为非当前记录，刷新列表后不再展示。

建议另设“重新生成 AI 内容”入口，点击后先弹出二次确认，明确提示会覆盖本行全部人工内容；用户确认后使用 `overwriteManualChanges: true` 调用同一刷新接口。该参数只对本次请求有效：

- AI 成功生成：后端覆盖整行内容，并将 `manualAdjusted` 重置为 `false`；后续普通刷新重新按现场测评自动更新。
- AI 未配置或调用失败：后端保留人工内容及 `manualAdjusted=true`，不会清空已确认的内容。

刷新成功后的提示建议组合后端统计，例如：

```text
汇总分析已刷新：AI生成成功 6 条，未配置 0 条，生成失败 1 条；保留人工修改 3 条。
```

## 4. 列表字段与状态展示

三个列表接口均支持分页参数：

```http
GET /api/v1/projects/{projectId}/risk-sources?pageNo=1&pageSize=10
GET /api/v1/projects/{projectId}/risk-items?pageNo=1&pageSize=10
GET /api/v1/projects/{projectId}/risk-suggestions?pageNo=1&pageSize=10
```

分页数据位于 `data.list`，并包含 `data.pageNo`、`data.pageSize`、`data.total`。`pageSize` 可取 1 至 200。

### 4.1 与 AI 生成直接相关的字段

| 字段 | 含义 | 前端处理要求 |
| --- | --- | --- |
| `riskDescription` | 风险描述 | 在风险源清单、风险清单中按原格式展示；允许为空。 |
| `riskSourceDescription` | 风险源描述 | 在风险源清单、风险清单中按原格式展示；允许为空。 |
| `remediationSuggestion` | 整改建议 | 在处置建议页保留换行展示；允许为空。 |
| `implementationPoints` | 本次生成使用的实施要求 | 建议放在详情抽屉或“生成依据”区域，默认可折叠；只读，不允许用户编辑。 |
| `evaluationRecord` | 现场测评的评估结果文本 | 作为生成依据展示时保留原始换行；只读。 |
| `evaluationResult` | 符合情况枚举 | 页面沿用现有映射：`COMPLIANT`=符合、`PARTIAL`=基本符合、`NON_COMPLIANT`=不符合、`NOT_APPLICABLE`=不适用。 |
| `analysisStatus` | AI 生成状态 | 按下表展示状态标签。 |
| `analysisErrorMessage` | 生成失败或未配置原因 | 仅在非成功状态有内容时展示。 |
| `analysisProvider` | 模型提供方 | 成功时可在详情中展示，例如 `dashscope`。 |
| `analysisModel` | 模型名称 | 成功时可在详情中展示，例如 `qwen-plus`。 |
| `manualAdjusted` | 是否曾人工保存过该风险记录 | 为 `true` 时显示“已人工修改，本行已锁定”标识；普通刷新会保留整行内容。 |

### 4.2 `analysisStatus` 显示规则

| 值 | 建议标签 | 三项 AI 文本的显示 | 用户可执行动作 |
| --- | --- | --- | --- |
| `SUCCESS` | 已生成 | 正常展示 | 可按原规则人工修改；详情可展示提供方和模型。 |
| `PENDING` | 待生成 | 显示“待生成”占位 | 等待本次刷新完成后重新拉取列表；不轮询。 |
| `DISABLED` | 未配置模型 | 不展示旧模板兜底文本，空值显示“未生成” | 提示“服务端未启用或未配置大模型”，可在服务端配置完成后刷新。 |
| `FAILED` | 生成失败 | 不展示旧模板兜底文本，空值显示“生成失败” | 展示 `analysisErrorMessage`，提供“刷新汇总分析”重试入口。 |

注意：`DISABLED`、`FAILED` 时后端会将三项文本置空，前端不能自行填充旧的固定风险模板，也不应把 `null` 渲染为字符串 `null`。

## 5. 人工修改与保存

### 5.1 风险描述、风险源描述

在“数据安全风险源清单”编辑弹窗中保存：

```http
PUT /api/v1/projects/{projectId}/risk-sources/{riskSourceId}
Content-Type: application/json
```

示例：

```json
{
  "riskDescription": "人工确认后的风险描述",
  "riskSourceDescription": "因审批控制缺失，导致高风险数据导出缺少有效追溯。"
}
```

后端还允许该页原有的 `riskTypes`、`relatedData`、`relatedActivities` 字段保存。不要在“数据安全风险清单”的保存接口中提交 `riskDescription` 或 `riskSourceDescription`，该接口不会修改这两个字段。

### 5.2 整改建议

在“数据安全风险处置建议”编辑弹窗中保存：

```http
PUT /api/v1/projects/{projectId}/risk-suggestions/{suggestionId}
Content-Type: application/json
```

示例：

```json
{
  "remediationSuggestion": "建议\n1、补齐高风险数据导出审批流程；\n2、启用操作审计并定期复核。"
}
```

文本框须支持多行输入与换行回显。保存任一实际人工修改后，后端会将该风险记录标记为 `manualAdjusted=true`；前端不要提交或修改 `manualAdjusted` 字段。

### 5.3 合并行保存

项目开启风险源合并时，“数据安全风险清单”和“数据安全风险处置建议”可能返回合并行。合并行会带有：

```json
{
  "merged": true,
  "mergedRiskRecordIds": ["riskrec-1", "riskrec-2"]
}
```

保存合并行时，除可编辑字段外，必须原样提交 `mergedRiskRecordIds`，后端才会把修改同步到全部原始风险记录。例如：

```json
{
  "remediationSuggestion": "建议补齐相关控制措施。",
  "mergedRiskRecordIds": ["riskrec-1", "riskrec-2"]
}
```

## 6. 页面推荐流程

```text
进入汇总分析
  → 查询三个列表
  → 用户点击“刷新汇总分析”
  → 禁用刷新按钮并显示加载遮罩
  → 调用刷新接口
  → 关闭遮罩，展示本轮统计
  → 重新查询三个列表
  → 按 analysisStatus 渲染 AI 内容、错误提示与人工修改标识
```

## 7. 验收清单

1. 刷新期间按钮不可重复点击，并显示明确的 AI 生成加载态。
2. 刷新成功后，三个页签均重新拉取列表；风险描述、风险源描述、整改建议显示最新内容。
3. `SUCCESS` 显示生成内容；`DISABLED`、`FAILED` 不显示旧固定模板文本。
4. `FAILED` 能展示后端 `analysisErrorMessage`，且用户可以重新刷新。
5. 风险源清单可分别保存风险描述、风险源描述；处置建议页可保存整改建议，保存后显示“已人工修改，本行已锁定”。
6. 普通刷新后，人工锁定行不被覆盖；用户确认“重新生成 AI 内容”且 AI 成功后，才覆盖并恢复自动维护。AI 失败或未配置时必须保留原人工内容。
7. 合并行保存时携带 `mergedRiskRecordIds`，修改能同步到该合并行包含的全部原始记录。

## 8. 兼容性说明

- 既有三个列表和三个保存接口路径不变；本次是新增 AI 状态与生成依据字段，以及调整文本的数据来源。
- 前端应兼容历史记录缺少 `implementationPoints`、`analysisProvider`、`analysisModel` 的情况，按空值处理即可。
- 不需要前端直接调用大模型，也不应传递模型密钥；模型调用完全由后端负责。
