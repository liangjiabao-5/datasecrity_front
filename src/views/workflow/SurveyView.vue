<template>
  <div>
    <ProjectHeader current-step="survey" />

    <div class="panel panel-pad survey-panel">
      <div class="workflow-panel-actions">
        <el-button :icon="Download" :loading="exportingTemplate" @click="downloadSurveyTemplate">下载模板</el-button>
        <el-upload
          :auto-upload="false"
          :show-file-list="false"
          accept=".docx"
          :disabled="importingWord"
          :on-change="importSurveyWord"
        >
          <el-button :icon="Upload" :loading="importingWord">导入</el-button>
        </el-upload>
        <el-button :icon="Download" :loading="exportingWord" @click="exportSurveyWord">导出</el-button>
        <el-button type="primary" @click="saveCurrentTab">保存</el-button>
        <el-button type="success" @click="router.push(`/projects/${projectId}/evaluation`)">下一步</el-button>
      </div>

      <el-tabs v-model="activeTab" @tab-change="load">
        <el-tab-pane label="数据处理者基本情况调研" name="processor">
          <el-form v-loading="loading" :model="processorBasicForm" label-position="top" class="survey-form">
            <section class="survey-section">
              <h3>1. 单位基本信息</h3>
              <el-row :gutter="20">
                <el-col :xs="24" :md="12">
                  <el-form-item label="单位名称">
                    <el-input v-model="processorBasicForm.unitName" placeholder="请输入单位名称" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item label="法人和其他组织统一社会信用代码">
                    <el-input v-model="processorBasicForm.unifiedSocialCreditCode" placeholder="请输入统一社会信用代码" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item label="办公地址">
                    <el-input v-model="processorBasicForm.officeAddress" placeholder="请输入办公地址" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item label="法定代表人信息">
                    <el-input v-model="processorBasicForm.legalRepresentative" placeholder="请输入法定代表人信息" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item label="人员规模">
                    <el-input v-model="processorBasicForm.staffSize" placeholder="请输入人员规模" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item label="经营范围">
                    <el-input v-model="processorBasicForm.businessScope" placeholder="请输入经营范围" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item label="数据安全负责人及其职务">
                    <el-input v-model="processorBasicForm.dataSecurityOfficer" placeholder="请输入数据安全负责人及其职务" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item label="联系方式">
                    <el-input v-model="processorBasicForm.contactInfo" placeholder="请输入联系方式" />
                  </el-form-item>
                </el-col>
              </el-row>
            </section>

            <section class="survey-section">
              <h3>2. 单位性质</h3>
              <el-form-item label="单位性质">
                <el-select v-model="processorBasicForm.unitNature" placeholder="请选择单位性质" style="width: 100%">
                  <el-option v-for="item in unitNatureOptions" :key="item" :label="item" :value="item" />
                </el-select>
              </el-form-item>
            </section>

            <section class="survey-section">
              <h3>3. 是否属于特定类型数据处理者</h3>
              <el-input
                v-model="processorBasicForm.specificProcessorType"
                placeholder="例如政务数据处理者、大型网络平台运营者、关键信息基础设施运营者等"
              />
            </section>

            <section class="survey-section">
              <h3>4. 所属电力行业类别</h3>
              <el-form-item
                label="该数据处理者在电力行业产业链中所属的具体环节或扮演的市场角色，如果数据处理者承担多个市场角色，可全部列举。"
              >
                <el-input v-model="processorBasicForm.powerIndustryCategory" placeholder="请输入所属电力行业类别" />
              </el-form-item>
              <div class="table-note">
                分类：A. 发电侧 B. 电网侧 C. 用电与售电侧 D. 市场交易 E. 技术与服务支撑
              </div>
            </section>

            <section class="survey-section">
              <h3>5. 运营地区</h3>
              <el-row :gutter="20">
                <el-col :xs="24" :md="12">
                  <el-form-item label="业务运营地区">
                    <el-input v-model="processorBasicForm.businessOperationArea" placeholder="请输入业务运营地区" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item label="开展数据处理活动所在国家和地区">
                    <el-input v-model="processorBasicForm.dataProcessingLocation" placeholder="请输入开展数据处理活动所在国家和地区" />
                  </el-form-item>
                </el-col>
              </el-row>
            </section>

            <section class="survey-section">
              <h3>6. 业务情况</h3>
              <el-row :gutter="20">
                <el-col :span="24">
                  <el-form-item label="主要业务范围">
                    <el-input
                      v-model="processorBasicForm.mainBusinessScope"
                      type="textarea"
                      :rows="3"
                      placeholder="参见所属电力行业类别，详细描述业务范围"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="业务规模">
                    <el-input v-model="processorBasicForm.businessScale" placeholder="如发电量/覆盖人群等" />
                  </el-form-item>
                </el-col>
              </el-row>
            </section>

            <section class="survey-section">
              <h3>7. 行政许可</h3>
              <el-form-item label="数据处理相关服务取得行政许可情况">
                <el-input
                  v-model="processorBasicForm.administrativeLicense"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入数据处理相关服务取得行政许可情况"
                />
              </el-form-item>
            </section>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="业务和信息系统调研" name="business">
          <el-form v-loading="loading" :model="businessForm" label-position="top" class="survey-form">
            <el-row :gutter="20">
              <el-col :xs="24" :md="12">
                <el-form-item label="信息系统名称">
                  <el-input v-model="businessForm.systemName" placeholder="请输入信息系统名称" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="业务功能描述">
                  <el-input v-model="businessForm.businessFunction" type="textarea" :rows="3" placeholder="请描述业务功能" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :xs="24" :md="8">
                <el-form-item label="业务服务对象">
                  <el-input v-model="businessForm.serviceObject" placeholder="请输入业务服务对象" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="8">
                <el-form-item label="业务用户规模">
                  <el-input v-model="businessForm.userScale" placeholder="请输入业务用户规模" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="8">
                <el-form-item label="业务覆盖地域">
                  <el-input v-model="businessForm.coverageArea" placeholder="请输入业务覆盖地域" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :xs="24" :md="12">
                <el-form-item label="网络安全等级保护备案等级">
                  <el-select v-model="businessForm.classifiedProtectionLevel" placeholder="请选择等级" style="width: 100%">
                    <el-option label="一级" value="LEVEL_1" />
                    <el-option label="二级" value="LEVEL_2" />
                    <el-option label="三级" value="LEVEL_3" />
                    <el-option label="四级" value="LEVEL_4" />
                    <el-option label="五级" value="LEVEL_5" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="业务相关部门信息">
                  <el-input v-model="businessForm.relatedDepartments" placeholder="请输入业务相关部门信息" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="数据范围">
                  <el-checkbox-group v-model="businessForm.dataScopes">
                    <el-checkbox v-for="item in dataScopeOptions" :key="item" :label="item">{{ item }}</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
              </el-col>
            </el-row>

            <div class="upload-row">
              <el-form-item label="上传拓扑图">
                <div class="upload-control">
                  <el-upload
                    :auto-upload="false"
                    :show-file-list="false"
                    :accept="diagramImageAccept"
                    :disabled="diagramUploading.topology"
                    :on-change="(file) => uploadBusinessDiagram('topology', file)"
                  >
                    <el-button :icon="Upload" :loading="diagramUploading.topology">上传拓扑图</el-button>
                  </el-upload>
                  <span>{{ businessForm.topologyFileId ? `文件ID：${businessForm.topologyFileId}` : '未上传文件' }}</span>
                  <el-button v-if="diagramDownloadUrls.topology" link type="primary" :icon="Download" @click="openDiagramDownload('topology')">下载</el-button>
                </div>
              </el-form-item>
              <el-form-item label="上传数据流转图">
                <div class="upload-control">
                  <el-upload
                    :auto-upload="false"
                    :show-file-list="false"
                    :accept="diagramImageAccept"
                    :disabled="diagramUploading.dataFlow"
                    :on-change="(file) => uploadBusinessDiagram('dataFlow', file)"
                  >
                    <el-button :icon="Upload" :loading="diagramUploading.dataFlow">上传数据流转图</el-button>
                  </el-upload>
                  <span>{{ businessForm.businessFlowFileId ? `文件ID：${businessForm.businessFlowFileId}` : '未上传文件' }}</span>
                  <el-button v-if="diagramDownloadUrls.dataFlow" link type="primary" :icon="Download" @click="openDiagramDownload('dataFlow')">下载</el-button>
                </div>
              </el-form-item>
            </div>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="数据资产调研" name="assets">
          <div v-loading="loading" class="table-stack">
            <section class="survey-section">
              <div class="section-header">
                <h3>数据资产情况</h3>
                <el-button type="primary" :icon="Plus" @click="addDataAsset">增加行</el-button>
              </div>
              <el-table :data="dataAssets" row-key="id" border>
                <el-table-column prop="dataName" label="数据名称" min-width="130">
                  <template #default="{ row }"><CompactCellInput v-model="row.dataName" /></template>
                </el-table-column>
                <el-table-column prop="dataForm" label="数据形态" min-width="120">
                  <template #default="{ row }"><CompactCellInput v-model="row.dataForm" /></template>
                </el-table-column>
                <el-table-column prop="dataScope" label="数据范围" min-width="120">
                  <template #default="{ row }"><CompactCellInput v-model="row.dataScope" /></template>
                </el-table-column>
                <el-table-column prop="dataScale" label="数据规模" min-width="120">
                  <template #default="{ row }"><CompactCellInput v-model="row.dataScale" /></template>
                </el-table-column>
                <el-table-column prop="dataSource" label="数据来源" min-width="130">
                  <template #default="{ row }"><CompactCellInput v-model="row.dataSource" /></template>
                </el-table-column>
                <el-table-column prop="storageLocation" label="数据存储分布情况" min-width="170">
                  <template #default="{ row }"><CompactCellInput v-model="row.storageLocation" /></template>
                </el-table-column>
                <el-table-column prop="flowDescription" label="数据处理活动" min-width="170">
                  <template #default="{ row }"><CompactCellInput v-model="row.flowDescription" /></template>
                </el-table-column>
                <el-table-column label="是否进行分类分级" min-width="150">
                  <template #default="{ row }"><el-switch v-model="row.classified" active-text="是" inactive-text="否" /></template>
                </el-table-column>
                <el-table-column prop="dataCategory" label="数据类别" min-width="130">
                  <template #default="{ row }"><CompactCellInput v-model="row.dataCategory" /></template>
                </el-table-column>
                <el-table-column prop="dataLevel" label="数据级别" min-width="120">
                  <template #default="{ row }"><CompactCellInput v-model="row.dataLevel" /></template>
                </el-table-column>
                <el-table-column label="是否为个人信息" min-width="140">
                  <template #default="{ row }"><el-switch v-model="row.personalInfo" active-text="是" inactive-text="否" /></template>
                </el-table-column>
                <el-table-column label="操作" width="100" fixed="right">
                  <template #default="{ row }">
                    <el-button link type="danger" @click="removeDataAsset(row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <div class="survey-pagination">
                <el-pagination
                  v-model:current-page="assetPagination['data-assets'].pageNo"
                  v-model:page-size="assetPagination['data-assets'].pageSize"
                  background
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="assetPagination['data-assets'].total"
                  :page-sizes="[10, 20, 50]"
                  @current-change="handleAssetPageChange('data-assets')"
                  @size-change="handleAssetPageSizeChange('data-assets')"
                />
              </div>
              <div class="table-note">
                数据形态、数据范围、数据规模、数据来源、存储分布、数据处理活动、分类分级、数据类别、数据级别和个人信息标识按原型表 A2 填写。
              </div>
            </section>

            <section class="survey-section">
              <div class="section-header">
                <h3>个人信息情况</h3>
                <el-button type="primary" :icon="Plus" @click="addSpecialRow('personal-info')">增加行</el-button>
              </div>
              <el-table :data="personalInfoRows" row-key="id" border>
                <el-table-column prop="dataName" label="数据名称" min-width="150">
                  <template #default="{ row }"><CompactCellInput v-model="row.dataName" /></template>
                </el-table-column>
                <el-table-column prop="dataCategory" label="个人信息类别" min-width="160">
                  <template #default="{ row }"><CompactCellInput v-model="row.dataCategory" /></template>
                </el-table-column>
                <el-table-column prop="scale" label="规模" min-width="130">
                  <template #default="{ row }"><CompactCellInput v-model="row.scale" /></template>
                </el-table-column>
                <el-table-column prop="sensitivity" label="敏感程度" min-width="140">
                  <template #default="{ row }"><CompactCellInput v-model="row.sensitivity" /></template>
                </el-table-column>
                <el-table-column prop="dataSource" label="数据来源" min-width="140">
                  <template #default="{ row }"><CompactCellInput v-model="row.dataSource" /></template>
                </el-table-column>
                <el-table-column prop="businessFlow" label="业务流转情况" min-width="170">
                  <template #default="{ row }"><CompactCellInput v-model="row.businessFlow" /></template>
                </el-table-column>
                <el-table-column label="操作" width="100" fixed="right">
                  <template #default="{ row }">
                    <el-button link type="danger" @click="removeSpecialRow('personal-info', row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <div class="survey-pagination">
                <el-pagination
                  v-model:current-page="assetPagination['personal-info'].pageNo"
                  v-model:page-size="assetPagination['personal-info'].pageSize"
                  background
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="assetPagination['personal-info'].total"
                  :page-sizes="[10, 20, 50]"
                  @current-change="handleAssetPageChange('personal-info')"
                  @size-change="handleAssetPageSizeChange('personal-info')"
                />
              </div>
              <div class="table-note">
                个人信息类别包括特征类、财产类、医疗类、通信类、行踪类、教育工作类、网络行为类、证件类等；敏感程度按相关法律法规口径填写。
              </div>
            </section>

            <section class="survey-section">
              <div class="section-header">
                <h3>重要数据情况</h3>
                <el-button type="primary" :icon="Plus" @click="addSpecialRow('important-data')">增加行</el-button>
              </div>
              <el-table :data="importantDataRows" row-key="id" border>
                <el-table-column prop="dataName" label="数据名称" min-width="160">
                  <template #default="{ row }"><CompactCellInput v-model="row.dataName" /></template>
                </el-table-column>
                <el-table-column prop="dataCategory" label="重要数据类别" min-width="160">
                  <template #default="{ row }"><CompactCellInput v-model="row.dataCategory" /></template>
                </el-table-column>
                <el-table-column prop="scale" label="规模" min-width="140">
                  <template #default="{ row }"><CompactCellInput v-model="row.scale" /></template>
                </el-table-column>
                <el-table-column prop="dataSource" label="数据来源" min-width="160">
                  <template #default="{ row }"><CompactCellInput v-model="row.dataSource" /></template>
                </el-table-column>
                <el-table-column prop="businessFlow" label="业务流转情况" min-width="180">
                  <template #default="{ row }"><CompactCellInput v-model="row.businessFlow" /></template>
                </el-table-column>
                <el-table-column label="操作" width="100" fixed="right">
                  <template #default="{ row }">
                    <el-button link type="danger" @click="removeSpecialRow('important-data', row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <div class="survey-pagination">
                <el-pagination
                  v-model:current-page="assetPagination['important-data'].pageNo"
                  v-model:page-size="assetPagination['important-data'].pageSize"
                  background
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="assetPagination['important-data'].total"
                  :page-sizes="[10, 20, 50]"
                  @current-change="handleAssetPageChange('important-data')"
                  @size-change="handleAssetPageSizeChange('important-data')"
                />
              </div>
            </section>

            <section class="survey-section">
              <div class="section-header">
                <h3>核心数据情况</h3>
                <el-button type="primary" :icon="Plus" @click="addSpecialRow('core-data')">增加行</el-button>
              </div>
              <el-table :data="coreDataRows" row-key="id" border>
                <el-table-column prop="dataName" label="数据名称" min-width="160">
                  <template #default="{ row }"><CompactCellInput v-model="row.dataName" /></template>
                </el-table-column>
                <el-table-column prop="dataCategory" label="核心数据类别" min-width="160">
                  <template #default="{ row }"><CompactCellInput v-model="row.dataCategory" /></template>
                </el-table-column>
                <el-table-column prop="scale" label="规模" min-width="140">
                  <template #default="{ row }"><CompactCellInput v-model="row.scale" /></template>
                </el-table-column>
                <el-table-column prop="dataSource" label="数据来源" min-width="160">
                  <template #default="{ row }"><CompactCellInput v-model="row.dataSource" /></template>
                </el-table-column>
                <el-table-column prop="businessFlow" label="业务流转情况" min-width="180">
                  <template #default="{ row }"><CompactCellInput v-model="row.businessFlow" /></template>
                </el-table-column>
                <el-table-column label="操作" width="100" fixed="right">
                  <template #default="{ row }">
                    <el-button link type="danger" @click="removeSpecialRow('core-data', row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <div class="survey-pagination">
                <el-pagination
                  v-model:current-page="assetPagination['core-data'].pageNo"
                  v-model:page-size="assetPagination['core-data'].pageSize"
                  background
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="assetPagination['core-data'].total"
                  :page-sizes="[10, 20, 50]"
                  @current-change="handleAssetPageChange('core-data')"
                  @size-change="handleAssetPageSizeChange('core-data')"
                />
              </div>
            </section>
          </div>
        </el-tab-pane>

        <el-tab-pane label="数据处理活动调研" name="processing">
          <div v-loading="loading" class="question-stack">
            <section class="survey-section">
              <el-form label-position="top">
                <el-form-item label="涉及处理活动类型">
                  <el-checkbox-group v-model="processingSurvey.involvedActivities">
                    <el-checkbox v-for="item in activityOptions" :key="item.value" :label="item.value">{{ item.label }}</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
              </el-form>
            </section>

            <section
              v-for="section in processingSections"
              :key="section.title"
              class="survey-section"
              :class="{ 'survey-section-disabled': section.activity && !isProcessingActivityEnabled(section.activity) }"
            >
              <h3>{{ section.title }}</h3>
              <el-form
                label-position="top"
                :disabled="Boolean(section.activity && !isProcessingActivityEnabled(section.activity))"
              >
                <el-row :gutter="20">
                  <el-col
                    v-for="field in section.fields"
                    :key="field.key"
                    :xs="24"
                    :md="field.span || 12"
                  >
                    <el-form-item :label="field.label">
                      <el-input
                        v-model="processingTextModel[field.key]"
                        :type="field.rows ? 'textarea' : undefined"
                        :rows="field.rows"
                        :placeholder="field.placeholder"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </section>
          </div>
        </el-tab-pane>

        <el-tab-pane label="安全防护措施调研" name="security">
          <div v-loading="loading" class="question-stack">
            <section v-for="section in securitySections" :key="section.no" class="survey-section question-section">
              <h3>
                {{ section.no }}. {{ section.title }}
                <span v-if="section.note" class="section-note-inline">{{ section.note }}</span>
              </h3>
              <el-form label-position="top">
                <el-row :gutter="20">
                  <el-col
                    v-for="field in section.fields"
                    :key="field.key"
                    :xs="24"
                    :md="field.span || 24"
                  >
                    <el-form-item :label="field.label">
                      <el-radio-group v-if="field.type === 'radio'" v-model="securityTextModel[field.key]">
                        <el-radio v-for="item in yesNoOptions" :key="item.value" :label="item.value">{{ item.label }}</el-radio>
                      </el-radio-group>
                      <el-input
                        v-else
                        v-model="securityTextModel[field.key]"
                        type="textarea"
                        :rows="field.rows || 3"
                        :placeholder="field.placeholder"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </section>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="importErrorVisible" title="信息调研导入异常明细" width="860px">
      <el-alert
        :title="importErrorMessage"
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 16px"
      />
      <el-table :data="importErrorRows" border max-height="420" empty-text="接口未返回异常明细">
        <el-table-column prop="tableName" label="表格" width="160" show-overflow-tooltip />
        <el-table-column prop="rowNo" label="行号" width="90" />
        <el-table-column prop="field" label="字段" width="160" show-overflow-tooltip />
        <el-table-column prop="reason" label="原因" min-width="360" show-overflow-tooltip />
      </el-table>
      <template #footer>
        <el-button type="primary" @click="importErrorVisible = false">知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { UploadFile } from 'element-plus';
import { Download, Plus, Upload } from '@element-plus/icons-vue';
import ProjectHeader from '@/components/ProjectHeader.vue';
import { fileApi } from '@/api/fileApi';
import { surveyApi } from '@/api/surveyApi';
import type {
  BusinessSystem,
  DataAsset,
  DataProcessorBasicSurvey,
  ProcessingActivitySurvey,
  ProcessingActivityType,
  SecurityProtection,
  SpecialDataRecord,
  SpecialDataType
} from '@/types/survey';
import type { ApiError } from '@/types/api';
import CompactCellInput from '@/components/CompactCellInput.vue';
import { downloadBlobFile } from '@/utils/fileActions';
import { emptyBusinessSystemForm, normalizeBusinessSystemForForm } from '@/utils/surveyBusinessSystem';
import { normalizeSurveyWordImportError } from '@/utils/surveyWordImportResult';
import type { SurveyWordImportError } from '@/utils/surveyWordImportResult';

type SurveyTabKey = 'processor' | 'business' | 'assets' | 'processing' | 'security';
type AssetListKey = 'data-assets' | SpecialDataType;
type AssetPagination = { pageNo: number; pageSize: number; total: number };
type Option = { label: string; value: string };
type TextField = {
  key: string;
  label: string;
  placeholder: string;
  rows?: number;
  span?: number;
  type?: 'radio';
};
type ProcessingSection = {
  title: string;
  activity?: ProcessingActivityType;
  fields: TextField[];
};
type SecuritySection = {
  no: number;
  title: string;
  note?: string;
  fields: TextField[];
};
type DiagramUploadType = 'topology' | 'dataFlow';

const route = useRoute();
const router = useRouter();
const projectId = String(route.params.projectId || '');
const activeTab = ref<SurveyTabKey>('processor');
const loading = ref(false);
const exportingTemplate = ref(false);
const importingWord = ref(false);
const exportingWord = ref(false);
const importErrorVisible = ref(false);
const importErrorMessage = ref('');
const importErrorRows = ref<SurveyWordImportError[]>([]);

const processorBasicForm = reactive<DataProcessorBasicSurvey>(emptyDataProcessorBasic());
const businessId = ref('');
const businessForm = reactive<Omit<BusinessSystem, 'id'>>(emptyBusiness());
const diagramImageAccept = '.vsdx';
const diagramImageExtensions = ['.vsdx'];
const diagramUploading = reactive<Record<DiagramUploadType, boolean>>({
  topology: false,
  dataFlow: false
});
const diagramDownloadUrls = reactive<Record<DiagramUploadType, string>>({
  topology: '',
  dataFlow: ''
});
const dataAssets = ref<DataAsset[]>([]);
const personalInfoRows = ref<SpecialDataRecord[]>([]);
const importantDataRows = ref<SpecialDataRecord[]>([]);
const coreDataRows = ref<SpecialDataRecord[]>([]);
const assetPagination = reactive<Record<AssetListKey, AssetPagination>>({
  'data-assets': { pageNo: 1, pageSize: 10, total: 0 },
  'personal-info': { pageNo: 1, pageSize: 10, total: 0 },
  'important-data': { pageNo: 1, pageSize: 10, total: 0 },
  'core-data': { pageNo: 1, pageSize: 10, total: 0 }
});
const processingSurvey = reactive<ProcessingActivitySurvey>(emptyProcessingSurvey());
const security = reactive<SecurityProtection>({});
const processingTextModel = processingSurvey as unknown as Record<string, string>;
const securityTextModel = security as Record<string, string | string[] | undefined>;

const diagramUploadLabels: Record<DiagramUploadType, string> = {
  topology: '拓扑图',
  dataFlow: '数据流转图'
};

const diagramUploadErrorMessages: Record<string, string> = {
  FILE_REQUIRED: '请选择需要上传的 .vsdx 文件',
  INVALID_DIAGRAM_FILE: '仅支持上传 .vsdx 文件',
  MINIO_CONFIG_INCOMPLETE: '后端 MinIO 配置不完整，请联系管理员检查配置',
  MINIO_BUCKET_UNAVAILABLE: 'MinIO bucket 不可用，请联系管理员检查对象存储',
  MINIO_UPLOAD_FAILED: '上传 MinIO 失败，请稍后重试',
  MINIO_DOWNLOAD_FAILED: '从 MinIO 下载失败，请稍后重试'
};

const yesNoOptions: Option[] = [
  { label: '是', value: 'YES' },
  { label: '否', value: 'NO' }
];
const unitNatureOptions = ['党政机关', '事业单位', '企业', '社会团体', '其他'];
const dataScopeOptions = ['一般数据', '个人信息', '重要数据', '核心数据'];
const activityOptions: Array<{ label: string; value: ProcessingActivityType }> = [
  { label: '收集', value: 'COLLECT' },
  { label: '传输', value: 'TRANSFER' },
  { label: '存储', value: 'STORE' },
  { label: '使用和加工', value: 'USE_PROCESS' },
  { label: '提供', value: 'PROVIDE' },
  { label: '公开', value: 'PUBLIC' },
  { label: '删除', value: 'DELETE' }
];

const processingActivityFields: Record<ProcessingActivityType, Array<keyof ProcessingActivitySurvey>> = {
  COLLECT: [
    'collectionDataScope',
    'collectionChannels',
    'collectionMethod',
    'collectionPurpose',
    'collectionFrequency',
    'collectionExternalSources',
    'collectionContracts',
    'collectionRelatedSystems',
    'collectionPublicDeviceUsage'
  ],
  TRANSFER: ['transferDataScope', 'transferDataLinkInventory', 'onlineChannel', 'offlineTransfer', 'transferProtocol', 'dataInterface'],
  STORE: [
    'storageDataScope',
    'storageMethod',
    'dataCenter',
    'storageSystem',
    'externalStorageProvider',
    'storageLocation',
    'storageDuration',
    'backupRedundancyStrategy'
  ],
  USE_PROCESS: ['useDataScope', 'usePurpose', 'useMethod', 'useScope', 'useScenario', 'algorithmRules', 'processingDetails', 'algorithmRecommendationService', 'entrustedOrJointProcessing'],
  PROVIDE: [
    'provideDataScope',
    'providePurpose',
    'provideMethod',
    'provideScope',
    'dataRecipients',
    'provideContracts',
    'providedPersonalInfoAndImportantData'
  ],
  PUBLIC: ['publicDataScope', 'publicPurpose', 'publicMethod', 'publicScope', 'publicAudienceSize', 'publicDataTypes', 'publicDataScale'],
  DELETE: ['deletionDataScope', 'deletionScenarios', 'deletionMethod', 'dataArchive', 'mediaDestruction']
};

const processingSections: ProcessingSection[] = [
  {
    title: '数据收集',
    activity: 'COLLECT',
    fields: [
      { key: 'collectionDataScope', label: '数据范围', placeholder: '具体涵盖的数据类型，包括但不限于个人信息、财务数据、运营数据、客户反馈、市场调研数据等', span: 24 },
      { key: 'collectionChannels', label: '数据收集渠道', placeholder: '（如涉及数据收集）指数据的来源途径，包括内部系统、第三方合作平台、传感器设备、公开数据集等', span: 24 },
      { key: 'collectionMethod', label: '收集方式', placeholder: '（如涉及数据收集）指数据采集的具体方法，如API接口调用、爬虫抓取、用户提交、自动化采集等', span: 24 },
      { key: 'collectionPurpose', label: '收集目的', placeholder: '明确收集数据的具体用途，如市场分析、产品改进、客户服务、内部管理等', span: 24 },
      { key: 'collectionFrequency', label: '收集频率', placeholder: '（如涉及数据收集）指数据收集的时间间隔，如实时收集、每日更新、每周汇总等', span: 24 },
      { key: 'collectionExternalSources', label: '外部数据源', placeholder: '（如涉及数据收集，且来源为外部数据源）指从外部获取的数据来源，包括合作伙伴、公共数据库、第三方服务商等', span: 24 },
      { key: 'collectionContracts', label: '合同协议', placeholder: '（如涉及数据收集，且来源为外部数据源）涉及数据收集的相关合同条款，确保数据获取的合法性和合规性', span: 24 },
      { key: 'collectionRelatedSystems', label: '相关系统', placeholder: '（如涉及数据收集）收集数据的系统名称', span: 24 },
      { key: 'collectionPublicDeviceUsage', label: '在被评估方公共场所安装图像采集、个人身份识别设备的情况', placeholder: '（如涉及数据收集）且数据包含个人信息，收集数据的系统名称', span: 24 }
    ]
  },
  {
    title: '数据存储',
    activity: 'STORE',
    fields: [
      { key: 'storageDataScope', label: '数据范围', placeholder: '具体涵盖的数据类型，包括但不限于个人信息、财务数据、运营数据、客户反馈、市场调研数据等', span: 24 },
      { key: 'storageMethod', label: '数据存储方式', placeholder: '（如涉及数据存储）数据存储的具体方法和技术，包括集中式存储、分布式存储、块存储、文件存储、对象存储等', span: 24 },
      { key: 'dataCenter', label: '数据中心', placeholder: '（如涉及数据存储）如用到数据中心，数据中心名称', span: 24 },
      { key: 'storageSystem', label: '存储系统', placeholder: '（如涉及数据存储）使用的存储系统，如数据库系统、大数据平台、云存储服务、网络硬盘、存储介质等', span: 24 },
      { key: 'externalStorageProvider', label: '外部存储机构', placeholder: '（如涉及数据存储）如数据存储外部，则填写外部存储机构名称', span: 24 },
      { key: 'storageLocation', label: '存储地点', placeholder: '（如涉及数据存储）具体的数据存储位置，包括本地服务器、异地数据中心、云端存储区域等，以及是否涉及跨国存储', span: 24 },
      { key: 'storageDuration', label: '存储期限', placeholder: '（如涉及数据存储）指数据存储的时间长度，包括保存期限、过期删除策略等', span: 24 },
      { key: 'backupRedundancyStrategy', label: '备份冗余策略', placeholder: '（如涉及数据存储）指数据备份的方法和频率，以及冗余存储方案以提高可靠性和容灾能力', span: 24 }
    ]
  },
  {
    title: '数据传输',
    activity: 'TRANSFER',
    fields: [
      { key: 'transferDataScope', label: '数据范围', placeholder: '具体涵盖的数据类型，包括但不限于个人信息、财务数据、运营数据、客户反馈、市场调研数据等', span: 24 },
      { key: 'transferDataLinkInventory', label: '数据链路盘点', placeholder: '请填写数据传输链路清单，并与业务流程图保持一致', rows: 4, span: 24 },
      { key: 'onlineChannel', label: '在线通道', placeholder: '（如涉及数据传输）包括互联网传输、虚拟专用网络（VPN）、物理专线等', span: 24 },
      { key: 'offlineTransfer', label: '离线传输', placeholder: '（如涉及数据传输）通过物理介质（如USB闪存盘、硬盘、光盘等）进行的数据传输', span: 24 },
      { key: 'transferProtocol', label: '传输协议', placeholder: '（如涉及数据传输）常用协议和加密协议，如HTTP(S)、FTP(S)、SFTP、TLS/SSL、SSH等', span: 24 },
      { key: 'dataInterface', label: '数据接口', placeholder: '（如涉及数据传输）API接口、接口安全措施、访问控制列表、速率限制等', span: 24 }
    ]
  },
  {
    title: '数据使用和加工',
    activity: 'USE_PROCESS',
    fields: [
      { key: 'useDataScope', label: '数据范围', placeholder: '具体涵盖的数据类型，包括但不限于个人信息、财务数据、运营数据、客户反馈、市场调研数据等', span: 24 },
      { key: 'usePurpose', label: '数据使用目的', placeholder: '（如涉及数据使用）具体用途，如市场营销分析、客户关系管理、产品优化、内部管理决策等', span: 24 },
      { key: 'useMethod', label: '数据使用方式', placeholder: '（如涉及数据使用）指数据访问的具体方式，包括直接查询、批量导出、实时流处理等', span: 24 },
      { key: 'useScope', label: '数据使用范围', placeholder: '（如涉及数据使用）具体说明哪些部门和人员有权访问和使用数据，以及各自的权限级别', span: 24 },
      { key: 'useScenario', label: '应用场景', placeholder: '（如涉及数据使用）列举数据在不同业务场景中的应用，如客户行为分析、风险管理、供应链优化等', span: 24 },
      { key: 'algorithmRules', label: '算法规则', placeholder: '（如涉及数据加工）使用何种算法模型进行数据处理和分析，如回归分析、聚类分析、深度学习模型等', span: 24 },
      { key: 'processingDetails', label: '数据加工情况', placeholder: '（如涉及数据加工）数据清洗、数据转换、数据标注等情况', span: 24 },
      { key: 'algorithmRecommendationService', label: '应用算法推荐技术提供互联网信息服务情况', placeholder: '（如涉及数据加工）应用算法推荐技术在互联网服务使用的方法', span: 24 },
      { key: 'entrustedOrJointProcessing', label: '核心数据、重要数据或个人信息委托处理、共同处理情况', placeholder: '（如涉及数据委托处理、共同处理）需明确第三方资质、处理方式、安全措施、合作协议、数据共享机制等', span: 24 }
    ]
  },
  {
    title: '数据提供',
    activity: 'PROVIDE',
    fields: [
      { key: 'provideDataScope', label: '数据范围', placeholder: '具体涵盖的数据类型，包括但不限于个人信息、财务数据、运营数据、客户反馈、市场调研数据等', span: 24 },
      { key: 'providePurpose', label: '数据提供目的', placeholder: '（如涉及数据提供）数据共享或交易的目的，如市场分析、客户洞察、联合营销等', span: 24 },
      { key: 'provideMethod', label: '数据提供方式', placeholder: '（如涉及数据提供）具体的数据共享机制，如通过API接口、文件传输、数据同步等方式', span: 24 },
      { key: 'provideScope', label: '数据提供范围', placeholder: '（如涉及数据提供）数据类型、数据量、数据属性或字段', span: 24 },
      { key: 'dataRecipients', label: '数据接收方', placeholder: '（如涉及数据提供）外部合作伙伴、内部部门、第三方机构等接收方及使用目的', span: 24 },
      { key: 'provideContracts', label: '合同协议', placeholder: '（如涉及数据提供）相关合同或协议、保密协议、责任条款等', span: 24 },
      { key: 'providedPersonalInfoAndImportantData', label: '对外提供的个人信息和重要数据', placeholder: '（如涉及个人信息或重要数据提供）个人信息种类、重要数据种类、数据量、敏感程度、保存期限', span: 24 }
    ]
  },
  {
    title: '数据公开',
    activity: 'PUBLIC',
    fields: [
      { key: 'publicDataScope', label: '数据范围', placeholder: '具体涵盖的数据类型，包括但不限于个人信息、财务数据、运营数据、客户反馈、市场调研数据等', span: 24 },
      { key: 'publicPurpose', label: '数据公开目的', placeholder: '（如涉及数据公开）业务需求、法律合规、社会责任等', span: 24 },
      { key: 'publicMethod', label: '数据公开方式', placeholder: '（如涉及数据公开）官方网站、社交媒体、新闻媒体、数据门户、纸质报告等', span: 24 },
      { key: 'publicScope', label: '对象范围', placeholder: '（如涉及数据公开）公众、特定群体、政府机构、行业协会等', span: 24 },
      { key: 'publicAudienceSize', label: '受众数量', placeholder: '（如涉及数据公开）广泛传播、特定受众、统计分析等', span: 24 },
      { key: 'publicDataTypes', label: '数据公开种类', placeholder: '（如涉及数据公开）', span: 24 },
      { key: 'publicDataScale', label: '数据公开规模', placeholder: '（如涉及数据公开）', span: 24 }
    ]
  },
  {
    title: '数据删除',
    activity: 'DELETE',
    fields: [
      { key: 'deletionDataScope', label: '数据范围', placeholder: '具体涵盖的数据类型，包括但不限于个人信息、财务数据、运营数据、客户反馈、市场调研数据等', span: 24 },
      { key: 'deletionScenarios', label: '数据删除情形', placeholder: '（如涉及数据删除）法律要求、业务需求、安全考虑、存储优化、用户请求、合同终止、业务调整等', span: 24 },
      { key: 'deletionMethod', label: '删除方式', placeholder: '（如涉及数据删除）逻辑删除、物理删除、安全擦除等', span: 24 },
      { key: 'dataArchive', label: '数据归档', placeholder: '（如涉及数据归档）描述归档的情况', span: 24 },
      { key: 'mediaDestruction', label: '介质销毁', placeholder: '（如涉及数据删除）物理销毁、化学销毁、热销毁等', span: 24 }
    ]
  },
  {
    title: '数据出境',
    fields: [
      { key: 'crossBorderDataScope', label: '数据范围', placeholder: '具体涵盖的数据类型，包括但不限于个人信息、财务数据、运营数据、客户反馈、市场调研数据等', span: 24 },
      { key: 'crossBorderPresence', label: '是否存在个人信息或重要数据出境', placeholder: '（如涉及数据出境）如跨境业务、跨境办公、境外上市、使用境外云服务或数据中心、国际交流合作等场景的数据出境情况', span: 24 },
      { key: 'crossBorderDescription', label: '数据出境情况说明', placeholder: '请输入数据出境的具体情况，如跨境业务、跨境办公、境外上市、使用境外云服务或数据中心、国际交流合作等', span: 24 }
    ]
  }
];

const securitySections: SecuritySection[] = [
  {
    no: 1,
    title: '等级保护测评、商用密码应用安全性评估等',
    fields: [{ key: 'complianceAssessmentStatus', label: '开展情况及整改情况', placeholder: '请输入已开展的等级保护测评、商用密码应用安全性评估、安全检测、风险评估、安全认证、合规审计情况，及发现问题的整改情况', span: 24 }]
  },
  {
    no: 2,
    title: '数据安全管理组织、人员及制度情况',
    fields: [{ key: 'dataSecurityManagement', label: '数据安全管理组织、人员及制度情况', placeholder: '请输入数据安全管理组织、人员及制度情况', span: 24 }]
  },
  {
    no: 3,
    title: '防火墙、入侵检测、入侵防御等网络安全设备及策略情况',
    fields: [{ key: 'networkSecurityDevicesAndPolicies', label: '网络安全设备及策略情况', placeholder: '请输入防火墙、入侵检测、入侵防御等网络安全设备及策略情况', span: 24 }]
  },
  {
    no: 4,
    title: '身份鉴别与访问控制情况',
    fields: [{ key: 'identityAuthenticationAndAccessControl', label: '身份鉴别与访问控制情况', placeholder: '请输入身份鉴别与访问控制情况', span: 24 }]
  },
  {
    no: 5,
    title: '网络安全漏洞管理及修复情况',
    fields: [{ key: 'vulnerabilityManagement', label: '网络安全漏洞管理及修复情况', placeholder: '请输入网络安全漏洞管理及修复情况', span: 24 }]
  },
  {
    no: 6,
    title: 'VPN等远程管理软件的用户及管理情况',
    fields: [{ key: 'remoteManagementSoftware', label: '远程管理软件用户及管理情况', placeholder: '请输入VPN等远程管理软件的用户及管理情况', span: 24 }]
  },
  {
    no: 7,
    title: '设备、系统及用户的账号口令管理情况',
    fields: [{ key: 'accountPasswordManagement', label: '账号口令管理情况', placeholder: '请输入设备、系统及用户的账号口令管理情况', span: 24 }]
  },
  {
    no: 8,
    title: '加密、脱敏、去标识化等安全技术应用情况',
    fields: [{ key: 'securityTechnologyApplication', label: '安全技术应用情况', placeholder: '请输入加密、脱敏、去标识化等安全技术应用情况', span: 24 }]
  },
  {
    no: 9,
    title: '电力监控系统防护措施要点',
    note: '如评估对象是电力监控系统，需填写以下内容',
    fields: [
      { key: 'isPowerMonitoringSystem', label: '是否为电力监控系统', placeholder: '', type: 'radio', span: 24 },
      { key: 'productionControlAreaProtection', label: '生产控制区和管理信息区的设置和防护情况', placeholder: '请输入生产控制区和管理信息区的设置和防护情况', span: 24 },
      { key: 'securityAccessAreaSetup', label: '安全接入区的设立情况', placeholder: '请输入安全接入区的设立情况', span: 24 },
      { key: 'powerMonitoringDedicatedNetwork', label: '电力监控专用网络的使用情况', placeholder: '请输入电力监控专用网络的使用情况', span: 24 },
      { key: 'zoneIsolationDeviceUsage', label: '生产控制区与管理信息区、安全接入区的隔离及隔离装置使用情况', placeholder: '请输入生产控制区与管理信息区、安全接入区的隔离及隔离装置使用情况', span: 24 },
      { key: 'wideAreaNetworkConnectionSecurity', label: '生产控制区与电力监控专用网络的广域网之间的联接安全方案', placeholder: '请输入生产控制区与电力监控专用网络的广域网之间的联接安全方案', span: 24 },
      { key: 'powerDispatchAuthentication', label: '电力调度认证机制建设情况', placeholder: '请输入电力调度认证机制建设情况', span: 24 },
      { key: 'networkServiceSecurityControl', label: '网络服务的安全管控情况', placeholder: '请输入网络服务的安全管控情况', span: 24 },
      { key: 'securityAccessAreaSecurityControl', label: '安全接入区的安全管控情况', placeholder: '请输入安全接入区的安全管控情况', span: 24 },
      { key: 'zoneBoundaryProtection', label: '电力监控系统分区边界的安全防护情况', placeholder: '请输入电力监控系统分区边界的安全防护情况', span: 24 },
      { key: 'productSecurityReliability', label: '系统使用的产品安全可靠情况', placeholder: '请输入系统使用的产品安全可靠情况', span: 24 },
      { key: 'operatorSecurityMonitoringWarning', label: '运营者的网络安全检测预警机制建设情况', placeholder: '请输入运营者的网络安全检测预警机制建设情况', span: 24 }
    ]
  },
  {
    no: 10,
    title: '3年内发生的网络和数据安全事件、攻击威胁情况',
    fields: [
      { key: 'securityIncidentsAndThreats', label: '3年内发生的网络和数据安全事件、攻击威胁情况', placeholder: '请输入3年内发生的网络和数据安全事件、攻击威胁情况，包括事件名称、数据类型和数量、发生原因、级别、处置措施、整改措施等', span: 24 },
      { key: 'detectedThreats', label: '实际环境中通过检测工具、监测系统、日志审计等发现的威胁', placeholder: '请输入实际环境中通过检测工具、监测系统、日志审计等发现的威胁', span: 24 },
      { key: 'publicThreatAlerts', label: '近期公开发布的社会或特定行业威胁事件、威胁预警', placeholder: '请输入近期公开发布的社会或特定行业威胁事件、威胁预警', span: 24 },
      { key: 'otherSecurityThreats', label: '其他可能面临的安全威胁', placeholder: '请输入其他可能面临的数据泄露、窃取、篡改、破坏/损毁、丢失、滥用、非法获取、非法利用、非法提供等安全威胁', span: 24 }
    ]
  }
];

function emptyBusiness(): Omit<BusinessSystem, 'id'> {
  return emptyBusinessSystemForm();
}

function emptyDataProcessorBasic(): DataProcessorBasicSurvey {
  return {
    unitName: '',
    unifiedSocialCreditCode: '',
    officeAddress: '',
    legalRepresentative: '',
    staffSize: '',
    businessScope: '',
    dataSecurityOfficer: '',
    contactInfo: '',
    unitNature: '',
    specificProcessorType: '',
    powerIndustryCategory: '',
    businessOperationArea: '',
    dataProcessingLocation: '',
    mainBusinessScope: '',
    businessScale: '',
    administrativeLicense: ''
  };
}

function emptyDataAsset(): DataAsset {
  return {
    id: temporaryId('asset'),
    businessSystemId: '',
    dataName: '',
    dataForm: '',
    dataScope: '',
    dataScale: '',
    dataSource: '',
    storageLocation: '',
    flowDescription: '',
    classified: false,
    dataCategory: '',
    dataLevel: '',
    personalInfo: false
  };
}

function emptySpecialRecord(type: SpecialDataType): SpecialDataRecord {
  return {
    id: temporaryId(type),
    dataName: '',
    dataCategory: '',
    scale: '',
    sensitivity: type === 'personal-info' ? '' : undefined,
    dataSource: '',
    businessFlow: '',
    processingActivities: [],
    description: ''
  };
}

function emptyProcessingSurvey(): ProcessingActivitySurvey {
  return {
    involvedActivities: [],
    collectionChannels: '',
    collectionMethod: '',
    collectionDataScope: '',
    collectionPurpose: '',
    collectionFrequency: '',
    collectionExternalSources: '',
    collectionContracts: '',
    collectionRelatedSystems: '',
    collectionPublicDeviceUsage: '',
    storageDataScope: '',
    storageMethod: '',
    dataCenter: '',
    storageSystem: '',
    externalStorageProvider: '',
    storageLocation: '',
    storageDuration: '',
    backupRedundancyStrategy: '',
    transferDataScope: '',
    transferDataLinkInventory: '',
    onlineChannel: '',
    offlineTransfer: '',
    transferProtocol: '',
    dataInterface: '',
    useDataScope: '',
    usePurpose: '',
    useMethod: '',
    useScope: '',
    useScenario: '',
    algorithmRules: '',
    processingDetails: '',
    algorithmRecommendationService: '',
    entrustedOrJointProcessing: '',
    provideDataScope: '',
    providePurpose: '',
    provideMethod: '',
    provideScope: '',
    dataRecipients: '',
    provideContracts: '',
    providedPersonalInfoAndImportantData: '',
    publicDataScope: '',
    publicPurpose: '',
    publicMethod: '',
    publicScope: '',
    publicAudienceSize: '',
    publicDataTypes: '',
    publicDataScale: '',
    deletionDataScope: '',
    deletionScenarios: '',
    deletionMethod: '',
    dataArchive: '',
    mediaDestruction: '',
    crossBorderDataScope: '',
    crossBorderPresence: '',
    crossBorderDescription: ''
  };
}

function temporaryId(prefix: string) {
  return `tmp-${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function isTemporary(id: string) {
  return id.startsWith('tmp-');
}

function isProcessingActivityEnabled(activity: ProcessingActivityType) {
  return processingSurvey.involvedActivities.includes(activity);
}

function resetProcessingActivityFields(activity: ProcessingActivityType) {
  const surveyModel = processingSurvey as unknown as Record<keyof ProcessingActivitySurvey, string | string[]>;
  processingActivityFields[activity].forEach((field) => {
    surveyModel[field] = Array.isArray(surveyModel[field]) ? [] : '';
  });
}

function clearDisabledProcessingSections() {
  activityOptions.forEach(({ value }) => {
    if (!isProcessingActivityEnabled(value)) resetProcessingActivityFields(value);
  });
}

function businessPayload() {
  return normalizeBusinessSystemForForm(businessForm);
}

function syncDiagramDownloadUrls() {
  diagramDownloadUrls.topology = businessForm.topologyFileId ? fileApi.downloadUrl(businessForm.topologyFileId) : '';
  diagramDownloadUrls.dataFlow = businessForm.businessFlowFileId ? fileApi.downloadUrl(businessForm.businessFlowFileId) : '';
}

function applySavedBusiness(saved: BusinessSystem) {
  const { id, ...payload } = saved;
  businessId.value = id;
  Object.assign(businessForm, normalizeBusinessSystemForForm(payload));
  syncDiagramDownloadUrls();
}

function applyUploadedBusinessSystem(system: Pick<BusinessSystem, 'id' | 'topologyFileId' | 'businessFlowFileId'>) {
  businessId.value = system.id;
  if (system.topologyFileId !== undefined) businessForm.topologyFileId = system.topologyFileId;
  if (system.businessFlowFileId !== undefined) businessForm.businessFlowFileId = system.businessFlowFileId;
  syncDiagramDownloadUrls();
}

function isAllowedDiagramFile(file: UploadFile) {
  const raw = file.raw;
  const fileName = (file.name || raw?.name || '').toLowerCase();
  return diagramImageExtensions.some((extension) => fileName.endsWith(extension));
}

function showDiagramUploadError(error: unknown) {
  const apiError = error as Partial<ApiError>;
  const message = apiError.code ? diagramUploadErrorMessages[apiError.code] || apiError.message : undefined;
  ElMessage.error(message || '图片上传失败，请稍后重试');
}

async function ensureBusinessSystemId() {
  if (businessId.value) return businessId.value;
  const saved = await surveyApi.saveBusinessSystem(projectId, businessPayload());
  applySavedBusiness(saved);
  return saved.id;
}

async function uploadBusinessDiagram(type: DiagramUploadType, file: UploadFile) {
  if (!file.raw) {
    ElMessage.error(diagramUploadErrorMessages.FILE_REQUIRED);
    return;
  }
  if (!isAllowedDiagramFile(file)) {
    ElMessage.error(diagramUploadErrorMessages.INVALID_DIAGRAM_FILE);
    return;
  }

  diagramUploading[type] = true;
  try {
    const businessSystemId = await ensureBusinessSystemId();
    const result = type === 'topology'
      ? await surveyApi.uploadTopologyDiagram(projectId, businessSystemId, file.raw)
      : await surveyApi.uploadDataFlowDiagram(projectId, businessSystemId, file.raw);
    applyUploadedBusinessSystem(result.businessSystem);
    diagramDownloadUrls[type] = result.file.downloadUrl || fileApi.downloadUrl(result.file.fileId);
    ElMessage.success(`${diagramUploadLabels[type]}上传成功`);
  } catch (error) {
    showDiagramUploadError(error);
  } finally {
    diagramUploading[type] = false;
  }
}

function openDiagramDownload(type: DiagramUploadType) {
  const url = diagramDownloadUrls[type];
  if (url) window.open(url, '_blank');
}

async function load() {
  loading.value = true;
  try {
    if (activeTab.value === 'processor') await loadProcessorBasic();
    if (activeTab.value === 'business') await loadBusiness();
    if (activeTab.value === 'assets') await loadAssets();
    if (activeTab.value === 'processing') await loadProcessing();
    if (activeTab.value === 'security') await loadSecurity();
  } finally {
    loading.value = false;
  }
}

async function loadAllSurveyTabs() {
  loading.value = true;
  try {
    await Promise.all([
      loadProcessorBasic(),
      loadBusiness(),
      loadAssets(),
      loadProcessing(),
      loadSecurity()
    ]);
  } finally {
    loading.value = false;
  }
}

async function loadProcessorBasic() {
  Object.assign(processorBasicForm, emptyDataProcessorBasic(), await surveyApi.getDataProcessorBasic(projectId));
}

async function loadBusiness() {
  const rows = await surveyApi.listBusinessSystems(projectId);
  const first = rows[0];
  if (first) {
    applySavedBusiness(first);
  } else {
    businessId.value = '';
    Object.assign(businessForm, emptyBusiness());
    syncDiagramDownloadUrls();
  }
}

async function loadAssets() {
  await Promise.all([
    loadAssetList('data-assets'),
    loadAssetList('personal-info'),
    loadAssetList('important-data'),
    loadAssetList('core-data')
  ]);
}

async function loadAssetList(type: AssetListKey) {
  const page = assetPagination[type];
  const query = { pageNo: page.pageNo, pageSize: page.pageSize };

  if (type === 'data-assets') {
    const result = await surveyApi.listDataAssets(projectId, query);
    dataAssets.value = result.list;
    Object.assign(page, result);
    return;
  }

  const result = await surveyApi.listSpecialData(projectId, type, query);
  rowListByType(type).value = result.list;
  Object.assign(page, result);
}

function handleAssetPageChange(type: AssetListKey) {
  void loadAssetList(type);
}

function handleAssetPageSizeChange(type: AssetListKey) {
  assetPagination[type].pageNo = 1;
  void loadAssetList(type);
}

async function loadProcessing() {
  Object.assign(processingSurvey, emptyProcessingSurvey(), await surveyApi.getProcessingActivitySurvey(projectId));
  clearDisabledProcessingSections();
}

async function loadSecurity() {
  Object.keys(security).forEach((key) => {
    delete security[key];
  });
  Object.assign(security, await surveyApi.getSecurityProtection(projectId));
}

function addDataAsset() {
  dataAssets.value.push(emptyDataAsset());
}

async function removeDataAsset(row: DataAsset) {
  if (!isTemporary(row.id)) {
    await ElMessageBox.confirm('确认删除该数据资产？', '删除确认', { type: 'warning' });
    await surveyApi.deleteDataAsset(projectId, row.id);
  }
  dataAssets.value = dataAssets.value.filter((item) => item.id !== row.id);
}

function rowListByType(type: SpecialDataType) {
  if (type === 'personal-info') return personalInfoRows;
  if (type === 'important-data') return importantDataRows;
  return coreDataRows;
}

function addSpecialRow(type: SpecialDataType) {
  rowListByType(type).value.push(emptySpecialRecord(type));
}

async function removeSpecialRow(type: SpecialDataType, row: SpecialDataRecord) {
  if (!isTemporary(row.id)) {
    await ElMessageBox.confirm('确认删除该记录？', '删除确认', { type: 'warning' });
    await surveyApi.deleteSpecialData(projectId, type, row.id);
  }
  const rows = rowListByType(type);
  rows.value = rows.value.filter((item) => item.id !== row.id);
}

async function saveBusiness() {
  const saved = await surveyApi.saveBusinessSystem(projectId, businessPayload(), businessId.value || undefined);
  applySavedBusiness(saved);
  ElMessage.success('业务和信息系统调研已保存');
}

async function saveProcessorBasic() {
  await surveyApi.saveDataProcessorBasic(projectId, JSON.parse(JSON.stringify(processorBasicForm)) as DataProcessorBasicSurvey);
  ElMessage.success('数据处理者基本情况调研已保存');
}

async function saveAssets() {
  for (const row of dataAssets.value) {
    const { id, ...payload } = row;
    const saved = await surveyApi.saveDataAsset(projectId, payload, isTemporary(id) ? undefined : id);
    row.id = saved.id;
  }
  await saveSpecialRows('personal-info', personalInfoRows.value);
  await saveSpecialRows('important-data', importantDataRows.value);
  await saveSpecialRows('core-data', coreDataRows.value);
  await loadAssets();
  ElMessage.success('数据资产调研已保存');
}

async function saveSpecialRows(type: SpecialDataType, rows: SpecialDataRecord[]) {
  for (const row of rows) {
    const { id, ...payload } = row;
    const saved = await surveyApi.saveSpecialData(projectId, type, payload, isTemporary(id) ? undefined : id);
    row.id = saved.id;
  }
}

async function saveProcessing() {
  clearDisabledProcessingSections();
  await surveyApi.saveProcessingActivitySurvey(projectId, JSON.parse(JSON.stringify(processingSurvey)) as ProcessingActivitySurvey);
  ElMessage.success('数据处理活动调研已保存');
}

async function saveSecurity() {
  await surveyApi.saveSecurityProtection(projectId, JSON.parse(JSON.stringify(security)) as SecurityProtection);
  ElMessage.success('安全防护措施调研已保存');
}

async function saveCurrentTab() {
  if (activeTab.value === 'processor') await saveProcessorBasic();
  if (activeTab.value === 'business') await saveBusiness();
  if (activeTab.value === 'assets') await saveAssets();
  if (activeTab.value === 'processing') await saveProcessing();
  if (activeTab.value === 'security') await saveSecurity();
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
};

async function downloadSurveyTemplate() {
  exportingTemplate.value = true;
  try {
    const { blob, fileName } = await surveyApi.exportTemplate(projectId);
    downloadBlobFile(fileName || `信息调研导入模板-${projectId}.docx`, blob);
    ElMessage.success('信息调研导入模板已下载');
  } catch (error) {
    ElMessage.error(`信息调研导入模板下载失败：${getErrorMessage(error, '请稍后重试')}`);
  } finally {
    exportingTemplate.value = false;
  }
}

function isDocxFile(file: UploadFile) {
  const name = (file.name || file.raw?.name || '').toLowerCase();
  return name.endsWith('.docx');
}

async function importSurveyWord(file: UploadFile) {
  if (!file.raw) return;
  if (!isDocxFile(file)) {
    ElMessage.error('导入文件必须是 .docx 格式');
    return;
  }

  importingWord.value = true;
  try {
    await surveyApi.importWord(projectId, file.raw);
    try {
      await loadAllSurveyTabs();
    } catch (refreshError) {
      ElMessage.warning(`信息调研 Word 导入成功，但页面刷新失败：${getErrorMessage(refreshError, '请手动刷新页面')}`);
      return;
    }
    ElMessage.success('信息调研 Word 导入成功');
  } catch (error) {
    const feedback = normalizeSurveyWordImportError(error);
    importErrorMessage.value = feedback.message;
    importErrorRows.value = feedback.errors;
    if (feedback.hasErrors) {
      importErrorVisible.value = true;
    }
    ElMessage.error(`信息调研 Word 导入失败：${feedback.message}`);
  } finally {
    importingWord.value = false;
  }
}

async function exportSurveyWord() {
  exportingWord.value = true;
  try {
    const { blob, fileName } = await surveyApi.exportWord(projectId);
    downloadBlobFile(fileName || `信息调研-${projectId}.docx`, blob);
    ElMessage.success('信息调研 Word 已导出');
  } catch (error) {
    ElMessage.error(`信息调研 Word 导出失败：${getErrorMessage(error, '请稍后重试')}`);
  } finally {
    exportingWord.value = false;
  }
}

watch(() => [...processingSurvey.involvedActivities], clearDisabledProcessingSections);

onMounted(load);
</script>

<style scoped>
.survey-panel :deep(.el-tabs__content) {
  overflow: visible;
}

.survey-form {
  max-width: 1180px;
}

.upload-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.upload-control {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  color: #64748b;
}

.upload-control span {
  word-break: break-all;
}

.table-stack,
.question-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.survey-section {
  width: 100%;
}

.survey-section-disabled {
  opacity: 0.62;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.survey-section h3,
.section-header h3 {
  margin: 0 0 14px;
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  text-align: center;
}

.section-header h3 {
  flex: 1;
  margin-bottom: 0;
}

.table-note {
  margin-top: 12px;
  padding: 12px 14px;
  border-left: 4px solid #2d8cf0;
  border-radius: 6px;
  background: #f8fafc;
  color: #64748b;
  font-size: 13px;
  line-height: 1.7;
}

.survey-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.inline-extra {
  max-width: 280px;
  margin-top: 10px;
}

.security-option-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 12px;
}

.security-extra-input {
  width: min(320px, 100%);
}

.question-section {
  padding-bottom: 16px;
  border-bottom: 1px solid #edf2f7;
}

.question-title {
  margin-bottom: 12px;
  color: #1f2937;
  font-weight: 600;
}

@media (max-width: 768px) {
  .upload-row {
    grid-template-columns: 1fr;
  }

  .section-header {
    align-items: stretch;
    flex-direction: column;
  }

  .section-header h3 {
    text-align: left;
  }
}
</style>
