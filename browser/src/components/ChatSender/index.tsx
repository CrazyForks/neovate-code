import {
  AppstoreAddOutlined,
  FileSearchOutlined,
  PaperClipOutlined,
  ProductOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import { Prompts, Sender, Suggestion } from '@ant-design/x';
import { useModel } from '@umijs/max';
import { Button, Flex, GetProp, Tag } from 'antd';
import { createStyles } from 'antd-style';
import { useRef, useState } from 'react';
import { useSuggestion } from '@/hooks/useSuggestion';
import * as context from '@/state/context';
import { actions, state } from '@/state/sender';
import { AiContextNodeConfig } from '@/types/chat';
import { isInputingAiContext } from '@/utils/chat';
import LexicalTextArea from './LexicalTextArea';
import { LexicalTextAreaContext } from './LexicalTextAreaContext';
import SenderHeader from './SenderHeader';

const SENDER_PROMPTS: GetProp<typeof Prompts, 'items'> = [
  {
    key: '1',
    description: 'Upgrades',
    icon: <ScheduleOutlined />,
  },
  {
    key: '2',
    description: 'Components',
    icon: <ProductOutlined />,
  },
  {
    key: '3',
    description: 'RICH Guide',
    icon: <FileSearchOutlined />,
  },
  {
    key: '4',
    description: 'Installation Introduction',
    icon: <AppstoreAddOutlined />,
  },
];

const AI_CONTEXT_NODE_CONFIGS: AiContextNodeConfig[] = [
  {
    matchRegex: /@File:\[(?<value>[^\]]+)\]/,
    aiContextId: 'file',
    pickInfo: (regExpExecArray) => ({
      value: regExpExecArray[0],
      displayText: regExpExecArray.groups?.value || '',
    }),
    render: ({ value, displayText }) => (
      <Tag
        color="red"
        className={'ai-context-node'}
        data-ai-context-id="file"
        contentEditable={false}
        style={{ userSelect: 'all' }}
      >
        {displayText}
      </Tag>
    ),
  },
  {
    matchRegex: /@Code:\[(?<value>[^\]]+)\]/,
    aiContextId: 'code',
    pickInfo: (regExpExecArray) => ({
      value: regExpExecArray[0],
      displayText: regExpExecArray.groups?.value || '',
    }),
    render: ({ value, displayText }) => (
      <Tag
        color="green"
        className={'ai-context-node'}
        data-ai-context-id="code"
        contentEditable={false}
        style={{ userSelect: 'all' }}
      >
        {displayText}
      </Tag>
    ),
  },
];

const useStyle = createStyles(({ token, css }) => {
  return {
    sender: css`
      width: 100%;
      max-width: 700px;
      margin: 0 auto;
    `,
    speechButton: css`
      font-size: 18px;
      color: ${token.colorText} !important;
    `,
    senderPrompt: css`
      width: 100%;
      max-width: 700px;
      margin: 0 auto;
      color: ${token.colorText};
    `,
  };
});

const ChatSender: React.FC = () => {
  const { styles } = useStyle();
  const { abortController, loading, onQuery } = useModel('chat');
  const [inputValue, setInputValue] = useState(state.prompt);
  const prevInputValue = useRef<string>(state.prompt);
  const { suggestions } = useSuggestion();

  // 处理输入变化
  const onChange = (value: string) => {
    setInputValue(value);
    actions.updatePrompt(value);
  };

  const handleSubmit = () => {
    onQuery(inputValue);
    actions.updatePrompt('');
    setInputValue('');
  };

  return (
    <>
      {/* 🌟 提示词 */}
      <Prompts
        items={SENDER_PROMPTS}
        onItemClick={(info) => {
          onQuery(info.data.description as string);
        }}
        styles={{
          item: { padding: '6px 12px' },
        }}
        className={styles.senderPrompt}
      />
      <LexicalTextAreaContext.Provider
        value={{
          onEnterPress: handleSubmit,
          aiContextNodeConfigs: AI_CONTEXT_NODE_CONFIGS,
        }}
      >
        {/* 🌟 输入框 */}
        <Suggestion
          items={suggestions}
          onSelect={(itemVal) => {
            context.actions.setFile(itemVal);
          }}
        >
          {({ onTrigger, onKeyDown }) => {
            return (
              <Sender
                value={inputValue}
                header={<SenderHeader />}
                onSubmit={handleSubmit}
                onChange={(value) => {
                  if (isInputingAiContext(prevInputValue.current, value)) {
                    onTrigger();
                  } else {
                    onTrigger(false);
                  }
                  prevInputValue.current = inputValue;
                  onChange(value);
                }}
                onKeyDown={onKeyDown}
                onCancel={() => {
                  abortController.current?.abort();
                }}
                prefix={
                  <Button
                    type="text"
                    icon={<PaperClipOutlined style={{ fontSize: 18 }} />}
                  />
                }
                loading={loading}
                className={styles.sender}
                allowSpeech
                actions={(_, info) => {
                  const { SendButton, LoadingButton, SpeechButton } =
                    info.components;
                  return (
                    <Flex gap={4}>
                      <SpeechButton className={styles.speechButton} />
                      {loading ? (
                        <LoadingButton type="default" />
                      ) : (
                        <SendButton type="primary" />
                      )}
                    </Flex>
                  );
                }}
                components={{
                  input: LexicalTextArea,
                }}
                placeholder="Ask or input @ use skills"
              />
            );
          }}
        </Suggestion>
      </LexicalTextAreaContext.Provider>
    </>
  );
};

export default ChatSender;
