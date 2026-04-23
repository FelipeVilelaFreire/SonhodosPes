'use client';

import Image from 'next/image';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import Input from '@/src/components/ui/Input';
import Button from '@/src/components/ui/Button';
import FormField from '@/src/components/ui/FormField';
import { useLoginForm } from '@/src/hooks/auth/useLoginForm';
import { useAuth } from '@/src/contexts/AuthContext';
import { STRINGS } from '@/src/constants/strings';
import styles from './LoginForm.module.css';

export default function LoginForm() {
  const form = useLoginForm();
  const { mockMode } = useAuth();

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <Image
              src="/logo.svg"
              alt={STRINGS.app.name}
              width={260}
              height={46}
              className={styles.logoImg}
              priority
            />
          </div>
          <p className={styles.tagline}>{STRINGS.app.tagline}</p>
        </div>

        <h1 className={styles.title}>Entrar</h1>
        <p className={styles.subtitle}>Acesse o sistema de gestão</p>

        <form className={styles.form} onSubmit={form.handleSubmit}>
          {form.generalError && (
            <div className={styles.generalError}>{form.generalError}</div>
          )}

          <FormField label="Email" htmlFor="email" error={form.emailError} required>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={e => form.setEmail(e.target.value)}
              leftSlot={<Mail size={18} />}
              autoComplete="email"
              invalid={Boolean(form.emailError)}
              disabled={form.submitting}
              size="lg"
            />
          </FormField>

          <FormField label="Senha" htmlFor="password" error={form.passwordError} required>
            <Input
              id="password"
              type="password"
              placeholder="Sua senha"
              value={form.password}
              onChange={e => form.setPassword(e.target.value)}
              leftSlot={<Lock size={18} />}
              autoComplete="current-password"
              invalid={Boolean(form.passwordError)}
              disabled={form.submitting}
              size="lg"
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={form.submitting}
            rightIcon={!form.submitting ? <ArrowRight size={16} /> : undefined}
            className={styles.submitBtn}
          >
            {form.submitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        {mockMode && (
          <div className={styles.demoSection}>
            <h3 className={styles.demoTitle}>Preencher com demo</h3>
            <div className={styles.demoButtons}>
              <button
                type="button"
                className={styles.demoBtn}
                onClick={() => form.fillDemo('admin')}
              >
                Admin
              </button>
              <button
                type="button"
                className={styles.demoBtn}
                onClick={() => form.fillDemo('gerente')}
              >
                Gerente
              </button>
              <button
                type="button"
                className={styles.demoBtn}
                onClick={() => form.fillDemo('vendedora')}
              >
                Vendedora
              </button>
            </div>
            <p className={styles.demoHint}>
              Modo demo ativo — Supabase não configurado.<br />
              Use os botões acima para testar cada role.
            </p>
          </div>
        )}

        <p className={styles.footer}>
          Sonho dos Pés — Gestão v0.2.0
        </p>
      </div>
    </div>
  );
}
