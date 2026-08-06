<template>
  <main class="login-page">
    <section class="login-card" aria-labelledby="login-title">
      <div class="login-brand">
        <img src="/logo.png" alt="ENST" />
        <div>
          <strong>ENST</strong>
          <span>数据安全风险评估</span>
        </div>
      </div>
      <div class="login-heading">
        <h1 id="login-title">欢迎登录</h1>
        <p>使用您的系统账号进入数据安全风险评估工作台。</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" size="large" @submit.prevent="submit">
        <el-form-item label="用户名" prop="username">
          <el-input v-model.trim="form.username" autocomplete="username" placeholder="请输入用户名" @keyup.enter="submit" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password autocomplete="current-password" placeholder="请输入密码" @keyup.enter="submit" />
        </el-form-item>
        <el-button class="login-submit" type="primary" native-type="submit" :loading="submitting">登录</el-button>
      </el-form>
      <p class="login-hint">如账号已停用或忘记密码，请联系系统管理员处理。</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const formRef = ref<FormInstance>();
const submitting = ref(false);
const form = reactive({ username: '', password: '' });
const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

const submit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    await auth.login(form);
    ElMessage.success('登录成功');
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/projects';
    await router.replace(redirect);
  } catch (error) {
    ElMessage.error((error as { message?: string })?.message || '登录失败，请检查用户名和密码');
  } finally {
    submitting.value = false;
  }
};
</script>
