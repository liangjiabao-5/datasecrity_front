# 信息调研 Word 导入导出功能修改说明

更新时间：2026-06-17

## 修改目标

信息调研页面需要使用 `附录A（资料性）调研表格.docx` 作为导入、导出模板。后端已新增 Word 文件导入、导出和模板下载接口，前端需要在信息调研页面增加对应按钮，并在导入成功后刷新页面中五个标签页的数据。

## 新增接口

### 1. 下载导入模板

```http
GET /api/v1/projects/{projectId}/survey/export-template
```

响应：直接下载 `.docx` 文件。

用途：前端“下载模板”按钮使用。文件内容为后端 `doc/附录A（资料性）调研表格.docx`。

### 2. 导入信息调研 Word

```http
POST /api/v1/projects/{projectId}/survey/import
Content-Type: multipart/form-data
```

请求字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| file | File | 用户上传的 `.docx` 文件 |

成功响应示例：

```json
{
  "code": "SUCCESS",
  "message": "Operation succeeded.",
  "data": {
    "dataProcessorBasic": {},
    "businessSystem": {},
    "processingActivity": {},
    "securityProtection": {},
    "counts": {
      "dataAssets": 1,
      "personalInfo": 1,
      "importantData": 1,
      "coreData": 1
    }
  }
}
```

导入覆盖规则：

- 数据处理者基本情况：覆盖当前项目的单表问卷。
- 业务和信息系统：覆盖当前项目第一条业务系统记录；如果不存在则创建。
- 数据资产、个人信息、重要数据、核心数据：覆盖当前页面已有列表，后端会软删除旧记录并创建上传文档中的新记录。
- 数据处理活动：按模板 A.7 中已填写内容覆盖对应问卷字段。
- 安全防护措施：按模板 A.8 中已填写内容覆盖对应问卷字段。

导入成功后，前端建议重新请求以下现有接口刷新页面：

```http
GET /api/v1/projects/{projectId}/survey/data-processor-basic
GET /api/v1/projects/{projectId}/survey/business-systems?pageNo=1&pageSize=10
GET /api/v1/projects/{projectId}/survey/data-assets?pageNo=1&pageSize=10
GET /api/v1/projects/{projectId}/survey/personal-info?pageNo=1&pageSize=10
GET /api/v1/projects/{projectId}/survey/important-data?pageNo=1&pageSize=10
GET /api/v1/projects/{projectId}/survey/core-data?pageNo=1&pageSize=10
GET /api/v1/projects/{projectId}/survey/processing-activity-survey
GET /api/v1/projects/{projectId}/survey/security-protection
```

错误响应示例：

```json
{
  "code": "IMPORT_VALIDATION_FAILED",
  "message": "导入文件存在格式错误",
  "data": {
    "errors": [
      {
        "tableName": null,
        "rowNo": 0,
        "field": "file",
        "reason": "导入文件必须是 .docx 格式。"
      }
    ]
  }
}
```

前端展示建议：如果 `data.errors` 存在，将 `tableName`、`rowNo`、`field`、`reason` 拼成错误列表展示；没有明细时展示 `message`。

### 3. 导出信息调研 Word

```http
GET /api/v1/projects/{projectId}/survey/export
```

响应：直接下载 `.docx` 文件。

用途：前端“导出”按钮使用。后端会以 `附录A（资料性）调研表格.docx` 为底稿，把当前页面内容回填后返回。

## 前端页面调整建议

1. 在信息调研页面操作区增加三个按钮：
   - 下载模板
   - 导入
   - 导出

2. 导入按钮交互：
   - 只允许选择 `.docx` 文件。
   - 上传时使用 `multipart/form-data`，字段名固定为 `file`。
   - 导入成功后提示“导入成功”，并刷新五个标签页相关接口。
   - 导入失败时展示后端返回的错误明细。

3. 导出按钮交互：
   - 请求 `GET /survey/export`。
   - 按响应头下载文件即可，不需要前端拼装 Word 内容。

4. 下载模板按钮交互：
   - 请求 `GET /survey/export-template`。
   - 文件名以后端响应为准。

## 模板字段对应关系

| Word 模板表格 | 页面标签页 | 后端数据 |
| --- | --- | --- |
| 表A.1 数据处理者基本情况调研表 | 数据处理者基本情况调研 | `data-processor-basic` |
| 表A.2 业务和信息系统调研 | 业务和信息系统调研 | `business-systems` 第一条 |
| 表A.3 数据资产调研表 | 数据资产调研 | `data-assets` |
| 表A.4 个人信息清单表 | 数据资产调研 | `personal-info` |
| 表A.5 重要数据清单表 | 数据资产调研 | `important-data` |
| 表A.6 核心数据清单表 | 数据资产调研 | `core-data` |
| 表A.7 数据处理活动调研内容说明 | 数据处理活动调研 | `processing-activity-survey` |
| 表A.8 安全防护措施调研表 | 安全防护措施调研 | `security-protection` |

## 注意事项

- 导入会覆盖数据资产相关四个列表，前端不需要再自行删除旧记录。
- 导入接口只接受 `.docx`，不接受 `.doc`、`.xlsx`、`.pdf`。
- 拓扑图、数据流转图仍沿用现有单独上传接口，本次 Word 模板导入导出不处理图片或 Visio 附件。
