import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { EmailEditorComponent, EmailEditorModule } from 'angular-email-editor';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-email-builder',
    standalone: true,
    imports: [CommonModule, EmailEditorModule],
    templateUrl: './email-builder.component.html',
})
export class EmailBuilderComponent {
    @ViewChild('editor') private emailEditor!: EmailEditorComponent;

    options: any = {
        locale: 'pt-BR',
        appearance: {
            theme: 'dark',
        },
        tools: {
            image: {
                enabled: true,
            },
        },
    };

    isSaving = false;

    constructor(
        private http: HttpClient,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    // Chamado quando o Unlayer termina de carregar
    editorLoaded(): void {
        this.registerImageUploadHandler();
        this.loadDefaultTemplate();
    }

    // Intercepta o upload de imagem dentro do editor e manda para o seu NestJS
    registerImageUploadHandler(): void {
        this.emailEditor.editor.registerCallback('image', (file: any, done: any) => {
            const formData = new FormData();
            // O Unlayer envia o arquivo no array attachments
            formData.append('file', file.attachments[0]);

            this.http.post<{ url: string }>(`${environment.apiUrl}/uploads`, formData).subscribe({
                next: (res) => {
                    // Devolve a URL pública da imagem hospedada para o editor exibir no e-mail
                    done({ progress: 100, url: res.url });
                },
                error: (err) => {
                    console.error('Erro ao fazer upload da imagem:', err);
                    alert('Falha ao enviar a imagem. Verifique o tamanho do arquivo.');
                },
            });
        });
    }

    // Define um layout inicial padrão com Logo da Zeit no Topo e Footer
    loadDefaultTemplate(): void {
        const defaultDesign: any = {
            counters: {
                u_row: 2,
                u_column: 2,
                u_content_image: 1,
                u_content_text: 1,
            },
            schemaVersion: 1,
            body: {
                id: 'body',

                rows: [
                    // Header (banner full-width, substitui a logo centralizada)
                    {
                        id: 'row_header',
                        cells: [1],
                        columns: [
                            {
                                id: 'col_header',
                                contents: [
                                    {
                                        id: 'img_header',
                                        type: 'image',
                                        values: {
                                            src: { url: 'https://seu-dominio.com/assets/newsletter/header.png' },
                                            align: 'center',
                                            maxWidth: '640px',
                                            altText: 'Zeit newsletter',
                                        },
                                    },
                                ],
                            },
                        ],
                    },

                    // Título + texto de introdução
                    {
                        id: 'row_title_intro',
                        cells: [1],
                        columns: [
                            {
                                id: 'col_title_intro',
                                contents: [
                                    {
                                        id: 'txt_title_intro',
                                        type: 'text',
                                        values: {
                                            containerPadding: '32px 16px 0px 16px',
                                            text:
                                                '<h1 style="margin:0;font-size:20px;line-height:25px;font-weight:700;color:#343941;font-family:Arial, Helvetica, sans-serif;">Bem-vindo ao campo inteligente, Usuário Zeit</h1>' +
                                                '<p style="margin:12px 0 0 0;font-size:14px;line-height:22px;color:#343941;font-family:Arial, Helvetica, sans-serif;">A partir de agora você vai receber conteúdo selecionado sobre o que há de mais relevante no agronegócio, só o que realmente importa para quem trabalha com o campo.</p>',
                                        },
                                    },
                                ],
                            },
                        ],
                    },

                    // Selo "O QUE VOCÊ VAI RECEBER:"
                    {
                        id: 'row_section_label',
                        cells: [1],
                        columns: [
                            {
                                id: 'col_section_label',
                                contents: [
                                    {
                                        id: 'txt_section_label',
                                        type: 'text',
                                        values: {
                                            containerPadding: '40px 16px 0px 16px',
                                            text:
                                                '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
                                                '<td style="background:#1A2539;color:#FFFFFF;font-size:14px;line-height:18px;padding:7px 8px;font-family:Arial, Helvetica, sans-serif;">O QUE VOCÊ VAI RECEBER:</td>' +
                                                '</tr></table>',
                                        },
                                    },
                                ],
                            },
                        ],
                    },

                    // Grade de features — linha 1 (feature 1 e 2)
                    {
                        id: 'row_features_1',
                        cells: [1, 1],
                        columns: [
                            {
                                id: 'col_feature_1',
                                contents: [
                                    {
                                        id: 'img_feature_1_icon',
                                        type: 'image',
                                        values: {
                                            src: { url: 'https://seu-dominio.com/assets/newsletter/feature-icon.png' },
                                            align: 'left',
                                            maxWidth: '36px',
                                            containerPadding: '16px 16px 0px 16px',
                                        },
                                    },
                                    {
                                        id: 'txt_feature_1',
                                        type: 'text',
                                        values: {
                                            containerPadding: '8px 16px 0px 16px',
                                            text:
                                                '<p style="margin:0;font-size:16px;line-height:19px;font-weight:700;color:#110723;font-family:Arial, Helvetica, sans-serif;">LOREM IPSUM</p>' +
                                                '<p style="margin:0;padding-top:8px;font-size:14px;line-height:20px;color:#110723;font-family:Arial, Helvetica, sans-serif;">Lorem ipsum dolor sit amet consectetur. Eu interdum sed id tortor.</p>',
                                        },
                                    },
                                ],
                            },
                            {
                                id: 'col_feature_2',
                                contents: [
                                    {
                                        id: 'img_feature_2_icon',
                                        type: 'image',
                                        values: {
                                            src: { url: 'https://seu-dominio.com/assets/newsletter/feature-icon.png' },
                                            align: 'left',
                                            maxWidth: '36px',
                                            containerPadding: '16px 16px 0px 16px',
                                        },
                                    },
                                    {
                                        id: 'txt_feature_2',
                                        type: 'text',
                                        values: {
                                            containerPadding: '8px 16px 0px 16px',
                                            text:
                                                '<p style="margin:0;font-size:16px;line-height:19px;font-weight:700;color:#110723;font-family:Arial, Helvetica, sans-serif;">LOREM IPSUM</p>' +
                                                '<p style="margin:0;padding-top:8px;font-size:14px;line-height:20px;color:#110723;font-family:Arial, Helvetica, sans-serif;">Lorem ipsum dolor sit amet consectetur. Eu interdum sed id tortor.</p>',
                                        },
                                    },
                                ],
                            },
                        ],
                    },

                    // Grade de features — linha 2 (feature 3 e 4)
                    {
                        id: 'row_features_2',
                        cells: [1, 1],
                        columns: [
                            {
                                id: 'col_feature_3',
                                contents: [
                                    {
                                        id: 'img_feature_3_icon',
                                        type: 'image',
                                        values: {
                                            src: { url: 'https://seu-dominio.com/assets/newsletter/feature-icon.png' },
                                            align: 'left',
                                            maxWidth: '36px',
                                            containerPadding: '48px 16px 0px 16px',
                                        },
                                    },
                                    {
                                        id: 'txt_feature_3',
                                        type: 'text',
                                        values: {
                                            containerPadding: '8px 16px 0px 16px',
                                            text:
                                                '<p style="margin:0;font-size:16px;line-height:19px;font-weight:700;color:#110723;font-family:Arial, Helvetica, sans-serif;">LOREM IPSUM</p>' +
                                                '<p style="margin:0;padding-top:8px;font-size:14px;line-height:20px;color:#110723;font-family:Arial, Helvetica, sans-serif;">Lorem ipsum dolor sit amet consectetur. Eu interdum sed id tortor.</p>',
                                        },
                                    },
                                ],
                            },
                            {
                                id: 'col_feature_4',
                                contents: [
                                    {
                                        id: 'img_feature_4_icon',
                                        type: 'image',
                                        values: {
                                            src: { url: 'https://seu-dominio.com/assets/newsletter/feature-icon.png' },
                                            align: 'left',
                                            maxWidth: '36px',
                                            containerPadding: '48px 16px 0px 16px',
                                        },
                                    },
                                    {
                                        id: 'txt_feature_4',
                                        type: 'text',
                                        values: {
                                            containerPadding: '8px 16px 0px 16px',
                                            text:
                                                '<p style="margin:0;font-size:16px;line-height:19px;font-weight:700;color:#110723;font-family:Arial, Helvetica, sans-serif;">LOREM IPSUM</p>' +
                                                '<p style="margin:0;padding-top:8px;font-size:14px;line-height:20px;color:#110723;font-family:Arial, Helvetica, sans-serif;">Lorem ipsum dolor sit amet consectetur. Eu interdum sed id tortor.</p>',
                                        },
                                    },
                                ],
                            },
                        ],
                    },

                    // Linha de frequência
                    {
                        id: 'row_frequency',
                        cells: [1],
                        columns: [
                            {
                                id: 'col_frequency',
                                contents: [
                                    {
                                        id: 'txt_frequency',
                                        type: 'text',
                                        values: {
                                            containerPadding: '56px 16px 0px 16px',
                                            text:
                                                '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>' +
                                                '<td style="width:18px;font-size:19px;line-height:20px;vertical-align:middle;padding-right:10px;color:#1A2539;font-family:Arial, Helvetica, sans-serif;">•</td>' +
                                                '<td style="font-size:14px;line-height:20px;color:#110723;font-family:Arial, Helvetica, sans-serif;"><strong>Frequência:</strong> 1 edição por mês, todo dia X às 10:00.</td>' +
                                                '</tr></table>',
                                        },
                                    },
                                ],
                            },
                        ],
                    },

                    // Selo "PARA COMEÇAR, UM CONTEÚDO ZEIT:"
                    {
                        id: 'row_content_label',
                        cells: [1],
                        columns: [
                            {
                                id: 'col_content_label',
                                contents: [
                                    {
                                        id: 'txt_content_label',
                                        type: 'text',
                                        values: {
                                            containerPadding: '62px 16px 0px 16px',
                                            text:
                                                '<span style="display:inline-block;background:#1A2539;color:#FFFFFF;font-size:14px;line-height:18px;padding:7px 8px;font-family:Arial, Helvetica, sans-serif;">PARA COMEÇAR, UM CONTEÚDO ZEIT:</span>',
                                        },
                                    },
                                ],
                            },
                        ],
                    },

                    // Card de artigo em destaque
                    {
                        id: 'row_article_card',
                        cells: [1],
                        columns: [
                            {
                                id: 'col_article_card',
                                contents: [
                                    {
                                        id: 'txt_article_card',
                                        type: 'text',
                                        values: {
                                            containerPadding: '12px 16px 0px 16px',
                                            text:
                                                '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EEEEEE;border-radius:4px;"><tr><td style="padding:18px 16px 20px 16px;font-family:Arial, Helvetica, sans-serif;">' +
                                                '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
                                                '<td valign="top"><img src="https://seu-dominio.com/assets/newsletter/bookmark.png" width="26" height="29" alt="" style="display:block;width:26px;height:29px;"></td>' +
                                                '<td align="right" valign="top"><span style="background:#1A2539;color:#08F6BB;font-size:10px;line-height:28px;font-weight:700;padding:0 10px;border-radius:4px;white-space:nowrap;">FINANÇAS</span></td>' +
                                                '</tr></table>' +
                                                '<p style="margin:0;padding-top:18px;font-size:16px;line-height:19px;font-weight:700;color:#110723;">LOREM IPSUM</p>' +
                                                '<p style="margin:0;padding-top:8px;font-size:14px;line-height:20px;color:#110723;">Lorem ipsum dolor sit amet consectetur. Arcu arcu venenatis quis justo integer non in in a in.</p>' +
                                                '<p style="margin:0;padding-top:25px;font-size:10px;line-height:14px;font-weight:700;"><a href="https://seu-dominio.com/artigo" target="_blank" style="color:#1A2539;text-decoration:underline;">LER PUBLICAÇÃO</a> <span style="font-size:14px;">→</span></p>' +
                                                '</td></tr></table>',
                                        },
                                    },
                                ],
                            },
                        ],
                    },

                    // Footer (endereço + redes sociais)
                    {
                        id: 'row_footer',
                        cells: [1, 1],
                        values: {
                            backgroundColor: '#EEEEEE',
                        },
                        columns: [
                            {
                                id: 'col_footer_info',
                                contents: [
                                    {
                                        id: 'txt_footer_info',
                                        type: 'text',
                                        values: {
                                            containerPadding: '28px 0px 25px 32px',
                                            text:
                                                '<div style="font-size:12px;line-height:20px;color:#110723;font-family:Arial, Helvetica, sans-serif;">Zeit®<br/>Estr. Mun. Norberto José Kipper, 2169<br/>Camobi, Santa Maria - RS, 97110-530<br/>contato@zeit.com.br<br/>(55) 9 9987-9899</div>',
                                        },
                                    },
                                ],
                            },
                            {
                                id: 'col_footer_social',
                                contents: [
                                    {
                                        id: 'txt_footer_social',
                                        type: 'text',
                                        values: {
                                            containerPadding: '28px 32px 25px 0px',
                                            textAlign: 'right',
                                            text:
                                                '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-left:auto;"><tr>' +
                                                '<td style="padding-left:12px;"><a href="https://wa.me/message/MCNLVBUJYSRPO1" target="_blank"><img src="https://seu-dominio.com/assets/newsletter/whatsapp.png" width="31" height="35" alt="WhatsApp" style="display:block;width:31px;height:35px;"></a></td>' +
                                                '<td style="padding-left:12px;"><a href="https://www.instagram.com/zeit.ia" target="_blank"><img src="https://seu-dominio.com/assets/newsletter/instagram.png" width="31" height="35" alt="Instagram" style="display:block;width:31px;height:35px;"></a></td>' +
                                                '<td style="padding-left:12px;"><a href="https://www.facebook.com/zeitbr" target="_blank"><img src="https://seu-dominio.com/assets/newsletter/facebook.png" width="31" height="35" alt="Facebook" style="display:block;width:31px;height:35px;"></a></td>' +
                                                '<td style="padding-left:12px;"><a href="https://www.linkedin.com/company/zeitia" target="_blank"><img src="https://seu-dominio.com/assets/newsletter/linkedin.png" width="32" height="35" alt="LinkedIn" style="display:block;width:32px;height:35px;"></a></td>' +
                                                '</tr></table>',
                                        },
                                    },
                                ],
                            },
                        ],
                    },

                    // Barra de descadastro
                    {
                        id: 'row_unsubscribe',
                        cells: [1],
                        columns: [
                            {
                                id: 'col_unsubscribe',
                                contents: [
                                    {
                                        id: 'txt_unsubscribe',
                                        type: 'text',
                                        values: {
                                            containerPadding: '14px 8px 0px 8px',
                                            textAlign: 'center',
                                            text:
                                                '<p style="margin:0;font-size:12px;line-height:18px;color:#1A2539;font-family:Arial, Helvetica, sans-serif;"><a href="https://seu-dominio.com/cancelar-inscricao" style="text-decoration:underline;color:#1A2539;">Cancelar assinatura</a></p>',
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        };

        this.emailEditor.editor.loadDesign(defaultDesign);
    }

    // Exporta o HTML pronto para usar na campanha
    exportAndUseHtml(): void {
        this.isSaving = true;

        this.emailEditor.editor.exportHtml((data: { design: any; html: string }) => {
            this.isSaving = false;
            this.cdr.detectChanges();

            // Armazena o HTML exportado
            localStorage.setItem('pending_campaign_html', data.html);

            // Redireciona para a tela de campanhas passando a flag
            alert('Layout exportado com sucesso!');
            this.router.navigate(['/campaigns'], { queryParams: { fromBuilder: 'true' } });
        });
    }
}